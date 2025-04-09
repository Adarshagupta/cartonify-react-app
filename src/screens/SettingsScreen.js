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
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const openReplicateWebsite = () => {
    Linking.openURL('https://replicate.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* API Key Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key-outline" size={22} color="#333" />
            <Text style={styles.sectionTitle}>API Key</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Enter your Replicate API key to use the image generation features.
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={openReplicateWebsite}
          >
            <Text style={styles.linkText}>Get an API key from replicate.com</Text>
            <Ionicons name="open-outline" size={16} color="#333" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Enter your Replicate API key"
            placeholderTextColor="#999"
            value={newApiKey}
            onChangeText={setNewApiKey}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleSaveApiKey}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Save API Key</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Model Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={22} color="#333" />
            <Text style={styles.sectionTitle}>AI Model</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Choose which AI model to use for image generation
          </Text>

          {isLoadingModels ? (
            <ActivityIndicator style={styles.modelLoading} color="#333" />
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
                  activeOpacity={0.7}
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
                    <Ionicons name="checkmark-circle" size={22} color="#333" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={22} color="#333" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.aboutContainer}>
            <Text style={styles.appName}>Cartonify</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.aboutText}>
              A modern, minimal app for generating images using AI.
            </Text>
            <View style={styles.poweredByContainer}>
              <Text style={styles.poweredByText}>Powered by</Text>
              <TouchableOpacity onPress={openReplicateWebsite}>
                <Text style={styles.replicateText}>Replicate API</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Extra space at bottom for better scrolling */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginRight: 4,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modelList: {
    marginTop: 8,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderWidth: 0,
  },
  selectedModelItem: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  modelName: {
    fontSize: 16,
    color: '#333',
  },
  selectedModelName: {
    fontWeight: '600',
    color: '#333',
  },
  modelLoading: {
    marginVertical: 20,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 14,
    color: '#888',
    marginRight: 4,
  },
  replicateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomSpace: {
    height: 40,
  },
});

export default SettingsScreen;
