import React, { useState, useContext, useRef } from 'react';
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
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { generateImage } from '../api/replicateApi';
import AppContext from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { apiKey, addGeneratedImage, selectedModel } = useContext(AppContext);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animate the image when it's generated
  const animateImage = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  };

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
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      setIsGenerating(true);
      const result = await generateImage(prompt, selectedModel);

      // The result could be a string URL or an array of URLs
      const imageUrl = Array.isArray(result) ? result[0] : result;

      setGeneratedImageUrl(imageUrl);
      addGeneratedImage(imageUrl, prompt);

      // Animate the image appearance
      animateImage();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewGallery = () => {
    navigation.navigate('Gallery');
  };

  const getModelName = () => {
    if (selectedModel.includes('flux-schnell')) return 'FLUX Schnell';
    if (selectedModel.includes('flux-1.1-pro')) return 'FLUX Pro';
    if (selectedModel.includes('sdxl')) return 'Stable Diffusion XL';
    return 'AI Model';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cartonify</Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleViewGallery}
        >
          <Ionicons name="images-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Model Badge */}
        <View style={styles.modelBadge}>
          <Ionicons name="flash-outline" size={16} color="#333" />
          <Text style={styles.modelText}>{getModelName()}</Text>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Describe the image you want to create..."
            placeholderTextColor="#999"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.button, isGenerating && styles.disabledButton]}
            onPress={handleGenerateImage}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Generate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isGenerating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#333" />
            <Text style={styles.loadingText}>Creating your masterpiece...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {/* Generated Image */}
        {generatedImageUrl && !isGenerating && (
          <Animated.View
            style={[
              styles.resultContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.imageHeader}>
              <Text style={styles.promptText} numberOfLines={1}>{prompt}</Text>
            </View>

            <Image
              source={{ uri: generatedImageUrl }}
              style={styles.generatedImage}
              resizeMode="contain"
            />

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewGallery}
              >
                <Ionicons name="arrow-forward-outline" size={20} color="#333" />
                <Text style={styles.actionButtonText}>View in Gallery</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Empty space at bottom for better scrolling */}
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
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  galleryButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  modelText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 0,
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: 'top',
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
    alignItems: 'center',
    flexDirection: 'row',
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
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  resultContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  generatedImage: {
    width: '100%',
    height: width * 0.8, // Make image height proportional to screen width
    backgroundColor: '#f9f9f9',
  },
  actionButtons: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
});

export default HomeScreen;
