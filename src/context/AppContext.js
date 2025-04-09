import React, { createContext, useState, useEffect } from 'react';
import { loadApiKey } from '../api/replicateApi';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/flux-schnell');

  // Load API key on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedApiKey = await loadApiKey();
        setApiKey(savedApiKey);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Add a generated image to history
  const addGeneratedImage = (image, prompt) => {
    const newImage = {
      id: Date.now().toString(),
      url: image,
      prompt,
      createdAt: new Date().toISOString(),
    };
    
    setGeneratedImages(prevImages => [newImage, ...prevImages]);
  };

  // Remove a generated image from history
  const removeGeneratedImage = (id) => {
    setGeneratedImages(prevImages => 
      prevImages.filter(image => image.id !== id)
    );
  };

  return (
    <AppContext.Provider
      value={{
        apiKey,
        setApiKey,
        isLoading,
        generatedImages,
        addGeneratedImage,
        removeGeneratedImage,
        selectedModel,
        setSelectedModel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
