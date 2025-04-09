import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadApiKey } from '../api/replicateApi';

export const AppContext = createContext();

// Message types for chat
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOADING: 'loading',
};

// System message to introduce the app
const SYSTEM_MESSAGE = {
  id: 'system-1',
  type: MESSAGE_TYPES.TEXT,
  content: 'Hi! I\'m Cartonify AI. I can generate images based on your descriptions or modify existing ones. Try asking me to create something!',
  sender: 'assistant',
  timestamp: new Date().toISOString(),
};

export const AppProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/flux-schnell');
  const [selectedChatModel, setSelectedChatModel] = useState('replicate/llama-2-70b-chat');

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);

  // Image editing state
  const [editingImage, setEditingImage] = useState(null);
  const [editHistory, setEditHistory] = useState([]);

  // Load app data on start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load API key
        const savedApiKey = await loadApiKey();
        setApiKey(savedApiKey);

        // Load generated images
        const savedImages = await AsyncStorage.getItem('generatedImages');
        if (savedImages) {
          setGeneratedImages(JSON.parse(savedImages));
        }

        // Load conversations
        const savedConversations = await AsyncStorage.getItem('conversations');
        if (savedConversations) {
          setConversations(JSON.parse(savedConversations));
        }

        // Load active chat or create a new one
        const savedActiveChat = await AsyncStorage.getItem('activeChat');
        if (savedActiveChat) {
          const activeChatData = JSON.parse(savedActiveChat);
          setActiveChat(activeChatData.id);
          setChatHistory(activeChatData.messages);
        } else {
          // Create a new chat if none exists
          const newChatId = Date.now().toString();
          const newChat = {
            id: newChatId,
            title: 'New Chat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [SYSTEM_MESSAGE],
          };

          setActiveChat(newChatId);
          setChatHistory([SYSTEM_MESSAGE]);
          setConversations([newChat]);

          // Save the new chat
          await AsyncStorage.setItem('activeChat', JSON.stringify(newChat));
          await AsyncStorage.setItem('conversations', JSON.stringify([newChat]));
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Save generated images to AsyncStorage whenever they change
  useEffect(() => {
    if (generatedImages.length > 0) {
      AsyncStorage.setItem('generatedImages', JSON.stringify(generatedImages));
    }
  }, [generatedImages]);

  // Save active chat whenever chat history changes
  useEffect(() => {
    if (activeChat && chatHistory.length > 0) {
      const updatedChat = {
        id: activeChat,
        title: getChatTitle(),
        updatedAt: new Date().toISOString(),
        messages: chatHistory,
      };

      AsyncStorage.setItem('activeChat', JSON.stringify(updatedChat));

      // Also update this chat in the conversations list
      const updatedConversations = conversations.map(chat =>
        chat.id === activeChat ? updatedChat : chat
      );

      setConversations(updatedConversations);
      AsyncStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  }, [chatHistory]);

  // Get a title for the chat based on the first user message
  const getChatTitle = () => {
    if (chatHistory.length <= 1) return 'New Chat';

    // Find the first user message
    const firstUserMessage = chatHistory.find(msg => msg.sender === 'user');
    if (!firstUserMessage) return 'New Chat';

    // Create a title from the first user message (truncate if needed)
    const title = firstUserMessage.content.substring(0, 30);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  };

  // Add a generated image to history
  const addGeneratedImage = (image, prompt) => {
    const newImage = {
      id: Date.now().toString(),
      url: image,
      prompt,
      createdAt: new Date().toISOString(),
      edits: [],
    };

    setGeneratedImages(prevImages => [newImage, ...prevImages]);
  };

  // Remove a generated image from history
  const removeGeneratedImage = (id) => {
    setGeneratedImages(prevImages =>
      prevImages.filter(image => image.id !== id)
    );
  };

  // Add a message to the current chat
  const addMessage = (message) => {
    setChatHistory(prevHistory => [...prevHistory, message]);
  };

  // Create a new chat
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [SYSTEM_MESSAGE],
    };

    setActiveChat(newChatId);
    setChatHistory([SYSTEM_MESSAGE]);
    setConversations(prevConversations => [newChat, ...prevConversations]);

    return newChatId;
  };

  // Switch to a different chat
  const switchChat = (chatId) => {
    const chat = conversations.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chatId);
      setChatHistory(chat.messages);
    }
  };

  // Delete a chat
  const deleteChat = (chatId) => {
    const updatedConversations = conversations.filter(chat => chat.id !== chatId);
    setConversations(updatedConversations);

    // If we're deleting the active chat, switch to another one or create a new one
    if (chatId === activeChat) {
      if (updatedConversations.length > 0) {
        switchChat(updatedConversations[0].id);
      } else {
        createNewChat();
      }
    }

    AsyncStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  // Start editing an image
  const startEditingImage = (imageId) => {
    const image = generatedImages.find(img => img.id === imageId);
    if (image) {
      setEditingImage(image);
    }
  };

  // Save an edited image
  const saveEditedImage = (originalImageId, newImageUrl, editPrompt) => {
    const timestamp = new Date().toISOString();

    // Add the edit to the image's edit history
    setGeneratedImages(prevImages =>
      prevImages.map(img => {
        if (img.id === originalImageId) {
          const editRecord = {
            id: Date.now().toString(),
            prompt: editPrompt,
            url: newImageUrl,
            timestamp,
          };

          return {
            ...img,
            url: newImageUrl, // Update the main image URL
            edits: [...(img.edits || []), editRecord],
          };
        }
        return img;
      })
    );

    // Clear the editing state
    setEditingImage(null);
  };

  return (
    <AppContext.Provider
      value={{
        // API and loading state
        apiKey,
        setApiKey,
        isLoading,

        // Image generation
        generatedImages,
        addGeneratedImage,
        removeGeneratedImage,
        selectedModel,
        setSelectedModel,
        selectedChatModel,
        setSelectedChatModel,

        // Chat functionality
        chatHistory,
        setChatHistory,
        activeChat,
        conversations,
        addMessage,
        createNewChat,
        switchChat,
        deleteChat,
        MESSAGE_TYPES,

        // Image editing
        editingImage,
        startEditingImage,
        saveEditedImage,
        editHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
