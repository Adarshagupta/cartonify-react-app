import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple in-memory vector representation using cosine similarity
// In a production app, you would use a proper vector database like Pinecone, Weaviate, etc.
class SimpleVectorDB {
  constructor() {
    this.vectors = [];
    this.documents = [];
  }

  // Add a document to the vector database
  async addDocument(text, metadata = {}) {
    // Simple vector representation (in production, use a proper embedding model)
    const vector = this.textToVector(text);
    const id = Date.now().toString();
    
    this.vectors.push({ id, vector });
    this.documents.push({ id, text, metadata });
    
    return id;
  }

  // Convert text to a simple vector representation
  textToVector(text) {
    // This is a very simplified version - in production use a proper embedding model
    // Here we just count occurrences of each word
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const wordCounts = {};
    
    words.forEach(word => {
      if (word.length > 2) { // Ignore very short words
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    return wordCounts;
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    // Calculate dot product
    for (const word in vec1) {
      if (vec2[word]) {
        dotProduct += vec1[word] * vec2[word];
      }
      mag1 += vec1[word] * vec1[word];
    }
    
    for (const word in vec2) {
      mag2 += vec2[word] * vec2[word];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }

  // Search for similar documents
  async search(query, topK = 3) {
    const queryVector = this.textToVector(query);
    
    // Calculate similarity scores
    const scores = this.vectors.map((item, index) => {
      const similarity = this.cosineSimilarity(queryVector, item.vector);
      return { 
        id: item.id, 
        similarity, 
        document: this.documents[index] 
      };
    });
    
    // Sort by similarity and return top K results
    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(item => item.similarity > 0.1); // Only return somewhat relevant results
  }

  // Load vectors from storage
  async load() {
    try {
      const vectorsData = await AsyncStorage.getItem('rag_vectors');
      const documentsData = await AsyncStorage.getItem('rag_documents');
      
      if (vectorsData && documentsData) {
        this.vectors = JSON.parse(vectorsData);
        this.documents = JSON.parse(documentsData);
      }
    } catch (error) {
      console.error('Error loading vector database:', error);
    }
  }

  // Save vectors to storage
  async save() {
    try {
      await AsyncStorage.setItem('rag_vectors', JSON.stringify(this.vectors));
      await AsyncStorage.setItem('rag_documents', JSON.stringify(this.documents));
    } catch (error) {
      console.error('Error saving vector database:', error);
    }
  }
}

// Main RAG Service
class RAGService {
  constructor() {
    this.vectorDB = new SimpleVectorDB();
    this.memory = {
      shortTerm: [], // Recent interactions
      longTerm: [],  // Important facts to remember
    };
    this.initialized = false;
  }

  // Initialize the service
  async initialize() {
    if (this.initialized) return;
    
    // Load vector database
    await this.vectorDB.load();
    
    // Load memory
    try {
      const shortTermData = await AsyncStorage.getItem('rag_short_term_memory');
      const longTermData = await AsyncStorage.getItem('rag_long_term_memory');
      
      if (shortTermData) {
        this.memory.shortTerm = JSON.parse(shortTermData);
      }
      
      if (longTermData) {
        this.memory.longTerm = JSON.parse(longTermData);
      }
    } catch (error) {
      console.error('Error loading memory:', error);
    }
    
    this.initialized = true;
  }

  // Save the current state
  async saveState() {
    await this.vectorDB.save();
    
    try {
      await AsyncStorage.setItem('rag_short_term_memory', JSON.stringify(this.memory.shortTerm));
      await AsyncStorage.setItem('rag_long_term_memory', JSON.stringify(this.memory.longTerm));
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  // Add a user message to the system
  async addUserMessage(message) {
    await this.initialize();
    
    // Add to short-term memory
    this.memory.shortTerm.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
    
    // Keep short-term memory manageable
    if (this.memory.shortTerm.length > 20) {
      this.memory.shortTerm = this.memory.shortTerm.slice(-20);
    }
    
    // Add to vector database for retrieval
    await this.vectorDB.addDocument(message, {
      type: 'user_message',
      timestamp: new Date().toISOString(),
    });
    
    await this.saveState();
  }

  // Add an assistant response to the system
  async addAssistantResponse(message, metadata = {}) {
    await this.initialize();
    
    // Add to short-term memory
    this.memory.shortTerm.push({
      role: 'assistant',
      content: message,
      timestamp: new Date().toISOString(),
    });
    
    // Add to vector database for retrieval
    await this.vectorDB.addDocument(message, {
      type: 'assistant_response',
      timestamp: new Date().toISOString(),
      ...metadata,
    });
    
    await this.saveState();
  }

  // Add a generated image to the system
  async addGeneratedImage(imageUrl, prompt) {
    await this.initialize();
    
    // Add to vector database
    await this.vectorDB.addDocument(prompt, {
      type: 'generated_image',
      imageUrl,
      timestamp: new Date().toISOString(),
    });
    
    // Add to long-term memory if it's the first of its kind
    const similarDocs = await this.vectorDB.search(prompt, 2);
    if (similarDocs.length <= 1) { // Only this document was found
      this.memory.longTerm.push({
        type: 'image_generation',
        prompt,
        imageUrl,
        timestamp: new Date().toISOString(),
      });
    }
    
    await this.saveState();
  }

  // Retrieve relevant context for a query
  async getRelevantContext(query) {
    await this.initialize();
    
    // Search for relevant documents
    const relevantDocs = await this.vectorDB.search(query, 5);
    
    // Format the context
    let context = '';
    
    // Add relevant documents
    if (relevantDocs.length > 0) {
      context += 'Here are some relevant past interactions:\n\n';
      
      relevantDocs.forEach((doc, index) => {
        if (doc.document.metadata.type === 'generated_image') {
          context += `${index + 1}. User asked to generate: "${doc.document.text}"\n`;
          context += `   You generated an image for them.\n\n`;
        } else if (doc.document.metadata.type === 'user_message') {
          context += `${index + 1}. User previously asked: "${doc.document.text}"\n\n`;
        } else if (doc.document.metadata.type === 'assistant_response') {
          context += `${index + 1}. You previously responded: "${doc.document.text}"\n\n`;
        }
      });
    }
    
    // Add long-term memory items
    if (this.memory.longTerm.length > 0) {
      context += 'Important things to remember:\n\n';
      
      this.memory.longTerm.slice(-5).forEach((item, index) => {
        if (item.type === 'image_generation') {
          context += `- User has previously generated images with the prompt: "${item.prompt}"\n`;
        }
      });
    }
    
    return context;
  }

  // Get recent conversation history
  getRecentConversation(maxMessages = 10) {
    return this.memory.shortTerm.slice(-maxMessages);
  }

  // Add an important fact to long-term memory
  async addToLongTermMemory(fact) {
    await this.initialize();
    
    this.memory.longTerm.push({
      type: 'fact',
      content: fact,
      timestamp: new Date().toISOString(),
    });
    
    // Keep long-term memory manageable
    if (this.memory.longTerm.length > 50) {
      this.memory.longTerm = this.memory.longTerm.slice(-50);
    }
    
    await this.saveState();
  }

  // Clear all memory and vectors
  async clearAll() {
    this.vectorDB.vectors = [];
    this.vectorDB.documents = [];
    this.memory.shortTerm = [];
    this.memory.longTerm = [];
    
    await AsyncStorage.removeItem('rag_vectors');
    await AsyncStorage.removeItem('rag_documents');
    await AsyncStorage.removeItem('rag_short_term_memory');
    await AsyncStorage.removeItem('rag_long_term_memory');
    
    this.initialized = false;
  }
}

// Export a singleton instance
const ragService = new RAGService();
export default ragService;
