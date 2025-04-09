import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppContext from '../context/AppContext';
import { generateImage, chatWithLlama } from '../api/replicateApi';
import ragService from '../services/RAGService';

const { width } = Dimensions.get('window');

// Message types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOADING: 'loading',
};

// Sample system message to introduce the app
const SYSTEM_MESSAGE = {
  id: 'system-1',
  type: MESSAGE_TYPES.TEXT,
  content: 'Hi! I\'m Cartonify AI. I can generate images based on your descriptions or modify existing ones. I can also chat with you using Meta\'s Llama 3 model. Try asking me to create an image or just chat about anything!',
  sender: 'assistant',
  timestamp: new Date().toISOString(),
};

// System instruction for Llama 3
const LLAMA_SYSTEM_INSTRUCTION = {
  id: 'system-llama',
  content: 'You are Cartonify AI, a helpful assistant powered by Meta\'s Llama 3 model. You can have conversations with users and also help them generate images. When users want to generate images, they typically use phrases like "generate", "create", "make", or "draw". For other queries, you provide helpful, concise, and friendly responses.',
  sender: 'system',
  timestamp: new Date().toISOString(),
};

const ChatScreen = () => {
  const { apiKey, addGeneratedImage, selectedModel, selectedChatModel } = useContext(AppContext);
  const [messages, setMessages] = useState([SYSTEM_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Animate new messages
  const animateNewMessage = () => {
    // Reset animation values
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Check if API key is set
    if (!apiKey) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        type: MESSAGE_TYPES.TEXT,
        content: inputText,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      // Add system response about missing API key
      const systemResponse = {
        id: (Date.now() + 1).toString(),
        type: MESSAGE_TYPES.TEXT,
        content: 'Please set your Replicate API key in the Settings tab to generate images.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages([...messages, userMessage, systemResponse]);
      setInputText('');
      return;
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: MESSAGE_TYPES.TEXT,
      content: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add loading message
    const loadingMessage = {
      id: (Date.now() + 1).toString(),
      type: MESSAGE_TYPES.LOADING,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage, loadingMessage]);
    setInputText('');

    // Check if the message is asking to generate an image
    const prompt = inputText.trim();
    const isGenerateImageRequest =
      prompt.toLowerCase().includes('generate') ||
      prompt.toLowerCase().includes('create') ||
      prompt.toLowerCase().includes('make') ||
      prompt.toLowerCase().includes('draw');

    try {
      if (isGenerateImageRequest) {
        setIsGenerating(true);

        // Extract the actual image description from the prompt
        let imagePrompt = prompt;
        const promptPrefixes = [
          'generate', 'create', 'make', 'draw', 'an image of', 'a picture of',
          'can you generate', 'can you create', 'can you make', 'can you draw',
          'please generate', 'please create', 'please make', 'please draw'
        ];

        // Remove common prefixes to get the actual image description
        for (const prefix of promptPrefixes) {
          if (imagePrompt.toLowerCase().startsWith(prefix)) {
            imagePrompt = imagePrompt.substring(prefix.length).trim();
            break;
          }
        }

        // Remove "of" at the beginning if present
        if (imagePrompt.toLowerCase().startsWith('of')) {
          imagePrompt = imagePrompt.substring(2).trim();
        }

        // Generate the image
        const result = await generateImage(imagePrompt, selectedModel);
        const imageUrl = Array.isArray(result) ? result[0] : result;

        // Add the generated image to history
        addGeneratedImage(imageUrl, imagePrompt);

        // Add to RAG service for context-aware responses
        await ragService.addGeneratedImage(imageUrl, imagePrompt);

        // Add important facts to long-term memory
        if (imagePrompt.toLowerCase().includes('favorite') ||
            imagePrompt.toLowerCase().includes('prefer') ||
            imagePrompt.toLowerCase().includes('like')) {
          await ragService.addToLongTermMemory(`User seems to like images of: ${imagePrompt}`);
        }

        // Replace loading message with image response
        const imageResponse = {
          id: loadingMessage.id,
          type: MESSAGE_TYPES.IMAGE,
          content: {
            url: imageUrl,
            prompt: imagePrompt,
          },
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        };

        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === loadingMessage.id ? imageResponse : msg
          )
        );

        // Add a follow-up text message
        const followUpMessage = {
          id: (Date.now() + 2).toString(),
          type: MESSAGE_TYPES.TEXT,
          content: 'Here\'s your image! What do you think? Would you like me to make any changes to it?',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        };

        setMessages(prevMessages => [...prevMessages, followUpMessage]);
      } else {
        // Handle regular text messages with Llama 3 + RAG
        try {
          // Add user message to RAG service
          await ragService.addUserMessage(userMessage.content);

          // Get relevant context from RAG service
          const relevantContext = await ragService.getRelevantContext(userMessage.content);

          // Prepare conversation history for Llama 3
          const conversationHistory = [
            LLAMA_SYSTEM_INSTRUCTION,
            ...messages.filter(msg => msg.type === MESSAGE_TYPES.TEXT).slice(-10), // Last 10 messages
            userMessage
          ];

          // Get response from Llama 3 with RAG context
          const llamaResponse = await chatWithLlama(conversationHistory, selectedChatModel, relevantContext);

          // Create assistant response message
          const assistantResponse = {
            id: loadingMessage.id,
            type: MESSAGE_TYPES.TEXT,
            content: llamaResponse,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
          };

          // Add assistant response to RAG service
          await ragService.addAssistantResponse(llamaResponse);

          // Update messages
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === loadingMessage.id ? assistantResponse : msg
            )
          );
        } catch (error) {
          console.error('Error chatting with Llama:', error);

          // Check if the message looks like an image generation request
          const isImageRequest = userMessage.content.toLowerCase().match(/\b(generate|create|draw|make|design)\b/);

          // Provide a smart fallback response based on the user's message
          let fallbackContent = '';

          if (isImageRequest) {
            fallbackContent = `I'd be happy to help with that image. Let me generate it for you. Just to confirm, you want me to create "${userMessage.content.replace(/^(generate|create|draw|make|design)\s+/i, '')}"?`;
          } else if (userMessage.content.toLowerCase().includes('hello') || userMessage.content.toLowerCase().includes('hi')) {
            fallbackContent = "Hello! I'm Cartonify AI. While I'm having trouble connecting to my language model right now, I can still help you generate amazing images. What would you like me to create for you today?";
          } else if (userMessage.content.toLowerCase().includes('how are you')) {
            fallbackContent = "I'm doing well, thanks for asking! While my chat capabilities are limited at the moment, I'm fully ready to generate images for you. Would you like me to create something?";
          } else if (userMessage.content.toLowerCase().includes('thank')) {
            fallbackContent = "You're welcome! I'm glad I could help. Would you like me to generate another image for you?";
          } else if (userMessage.content.toLowerCase().includes('help')) {
            fallbackContent = 'I can help you generate images based on your descriptions. Try saying something like "Generate a sunset over mountains" or "Create a cartoon cat wearing sunglasses".';
          } else {
            fallbackContent = `I'm having trouble connecting to my language model right now, but I can still help you generate images. Try saying something like "Generate a ${userMessage.content}" or "Create a cartoon version of ${userMessage.content}".`;
          }

          const fallbackResponse = {
            id: loadingMessage.id,
            type: MESSAGE_TYPES.TEXT,
            content: fallbackContent,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
          };

          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === loadingMessage.id ? fallbackResponse : msg
            )
          );

          // Still try to add this to RAG service for context
          try {
            await ragService.addAssistantResponse(fallbackContent);
          } catch (e) {
            console.error('Error adding fallback response to RAG:', e);
          }
        }
      }
    } catch (error) {
      // Handle error
      const errorMessage = {
        id: loadingMessage.id,
        type: MESSAGE_TYPES.TEXT,
        content: `Sorry, I couldn't generate that image. Error: ${error.message || 'Unknown error'}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === loadingMessage.id ? errorMessage : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Render a chat message
  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';

    // Render loading message
    if (item.type === MESSAGE_TYPES.LOADING) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#333" />
          <Text style={styles.loadingText}>Generating...</Text>
        </View>
      );
    }

    // Render text message
    if (item.type === MESSAGE_TYPES.TEXT) {
      return (
        <View style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText,
          ]}>
            {item.content}
          </Text>
        </View>
      );
    }

    // Render image message
    if (item.type === MESSAGE_TYPES.IMAGE) {
      return (
        <View style={styles.imageMessageContainer}>
          <Text style={styles.imagePromptText}>"{item.content.prompt}"</Text>
          <Image
            source={{ uri: item.content.url }}
            style={styles.generatedImage}
            resizeMode="contain"
          />
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cartonify Chat</Text>
        <TouchableOpacity
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Ask me to generate an image..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isGenerating}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputText.trim() ? "#CCC" : "#FFF"}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#333',
    borderBottomRightRadius: 4,
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#333333',
  },
  imageMessageContainer: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imagePromptText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 8,
  },
  generatedImage: {
    width: '100%',
    height: width * 0.6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
});

export default ChatScreen;
