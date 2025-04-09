import axios from 'axios';
import { REPLICATE_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for Replicate API
const API_URL = 'https://api.replicate.com/v1';

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${REPLICATE_API_KEY}`,
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

export default {
  generateImage,
  updateApiKey,
  loadApiKey,
  listModels,
};
