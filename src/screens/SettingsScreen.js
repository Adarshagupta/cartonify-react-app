import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import AppContext from '../context/AppContext';
import { updateApiKey } from '../api/replicateApi';
import { listModels } from '../api/replicateApi';

const SettingsScreen = () => {
  const { apiKey, setApiKey, selectedModel, setSelectedModel } = useContext(AppContext);
  const [newApiKey, setNewApiKey] = useState(apiKey || '');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Predefined models
  const predefinedModels = [
    { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell (Fast)' },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro (High Quality)' },
    { id: 'stability-ai/sdxl', name: 'Stable Diffusion XL' },
  ];

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      // We'll just use predefined models for now
      setModels(predefinedModels);
    } catch (error) {
      console.error('Error loading models:', error);
      Alert.alert('Error', 'Failed to load models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      Alert.alert('Error', 'API key cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const success = await updateApiKey(newApiKey);
      
      if (success) {
        setApiKey(newApiKey);
        Alert.alert('Success', 'API key updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update API key');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Key</Text>
          <Text style={styles.sectionDescription}>
            Enter your Replicate API key to use the image generation features.
            You can get an API key from replicate.com
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your Replicate API key"
            value={newApiKey}
            onChangeText={setNewApiKey}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleSaveApiKey}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save API Key</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Model</Text>
          <Text style={styles.sectionDescription}>
            Choose which AI model to use for image generation
          </Text>
          
          {isLoadingModels ? (
            <ActivityIndicator style={styles.modelLoading} />
          ) : (
            <View style={styles.modelList}>
              {predefinedModels.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelItem,
                    selectedModel === model.id && styles.selectedModelItem,
                  ]}
                  onPress={() => handleSelectModel(model.id)}
                >
                  <Text
                    style={[
                      styles.modelName,
                      selectedModel === model.id && styles.selectedModelName,
                    ]}
                  >
                    {model.name}
                  </Text>
                  {selectedModel === model.id && (
                    <View style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Cartonify v1.0.0{'\n'}
            A mobile app for generating images using AI.{'\n'}
            Powered by Replicate API.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a880e0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modelList: {
    marginTop: 10,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedModelItem: {
    borderColor: '#6200ee',
    backgroundColor: '#f5f0ff',
  },
  modelName: {
    fontSize: 16,
    color: '#333',
  },
  selectedModelName: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6200ee',
  },
  modelLoading: {
    marginVertical: 20,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default SettingsScreen;
