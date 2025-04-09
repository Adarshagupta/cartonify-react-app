import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { generateImage } from '../api/replicateApi';
import AppContext from '../context/AppContext';

const HomeScreen = ({ navigation }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { apiKey, addGeneratedImage, selectedModel } = useContext(AppContext);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        'Please set your Replicate API key in the settings',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }
        ]
      );
      return;
    }

    try {
      setIsGenerating(true);
      const result = await generateImage(prompt, selectedModel);
      
      // The result could be a string URL or an array of URLs
      const imageUrl = Array.isArray(result) ? result[0] : result;
      
      setGeneratedImageUrl(imageUrl);
      addGeneratedImage(imageUrl, prompt);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewGallery = () => {
    navigation.navigate('Gallery');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Cartonify</Text>
        <Text style={styles.subtitle}>AI Image Generator</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter a prompt to generate an image..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
          />
          
          <TouchableOpacity
            style={[styles.button, isGenerating && styles.disabledButton]}
            onPress={handleGenerateImage}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generate</Text>
            )}
          </TouchableOpacity>
        </View>

        {isGenerating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Generating your image...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {generatedImageUrl && !isGenerating && (
          <View style={styles.resultContainer}>
            <Image
              source={{ uri: generatedImageUrl }}
              style={styles.generatedImage}
              resizeMode="contain"
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleViewGallery}
              >
                <Text style={styles.actionButtonText}>View Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
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
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#6200ee',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  generatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
