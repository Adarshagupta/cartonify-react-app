import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for Replicate API
const API_URL = 'https://api.replicate.com/v1';

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Token ', // Will be updated with actual API key
  },
});

// Function to update API key (for settings screen)
export const updateApiKey = async (apiKey) => {
  try {
    await AsyncStorage.setItem('replicate_api_key', apiKey);
    api.defaults.headers.Authorization = `Token ${apiKey}`;
    return true;
  } catch (error) {
    console.error('Error updating API key:', error);
    return false;
  }
};

// Function to load API key from storage
export const loadApiKey = async () => {
  try {
    const apiKey = await AsyncStorage.getItem('replicate_api_key');
    if (apiKey) {
      api.defaults.headers.Authorization = `Token ${apiKey}`;
      return apiKey;
    }
    return null;
  } catch (error) {
    console.error('Error loading API key:', error);
    return null;
  }
};

// Function to generate an image using Replicate API
export const generateImage = async (prompt, modelVersion = 'black-forest-labs/flux-schnell') => {
  try {
    // Create prediction
    const createResponse = await api.post('/predictions', {
      version: modelVersion,
      input: { prompt },
    });

    const predictionId = createResponse.data.id;

    // Poll for prediction result
    let prediction = createResponse.data;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const pollResponse = await api.get(`/predictions/${predictionId}`);
      prediction = pollResponse.data;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Image generation failed');
    }

    return prediction.output;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

// Function to list available models
export const listModels = async (query = 'text-to-image') => {
  try {
    const response = await api.get('/models/search', {
      params: { query },
    });
    return response.data.results;
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
};

// Function to edit an image using text instructions
export const editImage = async (imageUrl, editPrompt, modelVersion = 'stability-ai/sdxl') => {
  try {
    // Create prediction with the image-to-image model
    const createResponse = await api.post('/predictions', {
      version: modelVersion,
      input: {
        prompt: editPrompt,
        image: imageUrl,
        strength: 0.7, // How much to transform the image (0-1)
      },
    });

    const predictionId = createResponse.data.id;

    // Poll for prediction result
    let prediction = createResponse.data;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const pollResponse = await api.get(`/predictions/${predictionId}`);
      prediction = pollResponse.data;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Image editing failed');
    }

    return prediction.output;
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
};

// Function to perform inpainting (edit specific parts of an image)
export const inpaintImage = async (imageUrl, maskUrl, prompt, modelVersion = 'stability-ai/sdxl-inpainting') => {
  try {
    // Create prediction with the inpainting model
    const createResponse = await api.post('/predictions', {
      version: modelVersion,
      input: {
        prompt: prompt,
        image: imageUrl,
        mask: maskUrl,
      },
    });

    const predictionId = createResponse.data.id;

    // Poll for prediction result
    let prediction = createResponse.data;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const pollResponse = await api.get(`/predictions/${predictionId}`);
      prediction = pollResponse.data;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Image inpainting failed');
    }

    return prediction.output;
  } catch (error) {
    console.error('Error inpainting image:', error);
    throw error;
  }
};

// Function to generate image variations
export const generateVariations = async (imageUrl, modelVersion = 'stability-ai/sdxl') => {
  try {
    // Create prediction with image as input but no prompt (creates variations)
    const createResponse = await api.post('/predictions', {
      version: modelVersion,
      input: {
        image: imageUrl,
        prompt: "", // Empty prompt for variations
        strength: 0.5,
        num_outputs: 4,
      },
    });

    const predictionId = createResponse.data.id;

    // Poll for prediction result
    let prediction = createResponse.data;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const pollResponse = await api.get(`/predictions/${predictionId}`);
      prediction = pollResponse.data;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Generating variations failed');
    }

    return prediction.output;
  } catch (error) {
    console.error('Error generating variations:', error);
    throw error;
  }
};

// Function to chat with Llama 3 model with RAG
export const chatWithLlama = async (messages, modelVersion = 'replicate/llama-2-70b-chat', ragContext = '') => {
  try {
    // Extract just the content for simpler models that don't use the chat format
    const lastUserMessage = messages.filter(msg => msg.sender === 'user').pop();
    const systemMessage = messages.find(msg => msg.sender === 'system');

    // Build a simple prompt string - this is the most reliable approach
    let prompt = '';

    // Add system instruction if available
    if (systemMessage) {
      prompt += systemMessage.content + '\n\n';
    }

    // Add RAG context if available
    if (ragContext && ragContext.trim() !== '') {
      prompt += 'Context information to help with your response:\n' + ragContext + '\n\n';
    }

    // Add the last few messages for context
    const recentMessages = messages
      .filter(msg => (msg.type === 'text' || !msg.type) && (msg.sender === 'user' || msg.sender === 'assistant'))
      .slice(-6); // Last 3 exchanges

    if (recentMessages.length > 0) {
      prompt += 'Recent conversation history:\n';
      recentMessages.forEach(msg => {
        const role = msg.sender === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add the user's message if not already included in recent messages
    if (lastUserMessage && !recentMessages.some(msg =>
        msg.sender === 'user' && msg.content === lastUserMessage.content)) {
      prompt += 'User: ' + lastUserMessage.content + '\n';
    }

    // Add the assistant prompt
    prompt += 'Assistant: ';

    // Create prediction with the Llama model - using the simplest possible format
    const createResponse = await api.post('/predictions', {
      version: modelVersion,
      input: {
        prompt: prompt,
        max_length: 500,
        temperature: 0.75,
      },
    });

    const predictionId = createResponse.data.id;

    // Poll for prediction result
    let prediction = createResponse.data;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const pollResponse = await api.get(`/predictions/${predictionId}`);
      prediction = pollResponse.data;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Chat response failed');
    }

    return prediction.output;
  } catch (error) {
    console.error('Error chatting with Llama:', error);
    throw error;
  }
};

export default {
  generateImage,
  updateApiKey,
  loadApiKey,
  listModels,
  editImage,
  inpaintImage,
  generateVariations,
  chatWithLlama,
};
