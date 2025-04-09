import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppContext from '../context/AppContext';
import { editImage, generateVariations } from '../api/replicateApi';

const { width } = Dimensions.get('window');

const ImageEditorScreen = ({ route, navigation }) => {
  const { imageId } = route.params || {};
  const { 
    generatedImages, 
    apiKey, 
    saveEditedImage, 
    selectedModel 
  } = useContext(AppContext);
  
  const [image, setImage] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState('text'); // 'text' or 'variations'
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Load the image data when the component mounts
  useEffect(() => {
    if (imageId) {
      const foundImage = generatedImages.find(img => img.id === imageId);
      if (foundImage) {
        setImage(foundImage);
        // Set a default edit prompt based on the original prompt
        setEditPrompt(`${foundImage.prompt}, but with`);
      } else {
        Alert.alert('Error', 'Image not found');
        navigation.goBack();
      }
    } else {
      Alert.alert('Error', 'No image selected for editing');
      navigation.goBack();
    }
  }, [imageId, generatedImages]);
  
  // Animate the image when it changes
  const animateImage = () => {
    // Reset animation values
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Handle text-based editing
  const handleTextEdit = async () => {
    if (!editPrompt.trim()) {
      Alert.alert('Error', 'Please enter an edit prompt');
      return;
    }
    
    if (!apiKey) {
      Alert.alert('API Key Required', 'Please set your Replicate API key in the settings');
      return;
    }
    
    try {
      setIsEditing(true);
      
      const result = await editImage(image.url, editPrompt, selectedModel);
      const editedImageUrl = Array.isArray(result) ? result[0] : result;
      
      // Save the edited image
      saveEditedImage(image.id, editedImageUrl, editPrompt);
      
      // Update the local state
      setImage({
        ...image,
        url: editedImageUrl,
      });
      
      // Reset the edit prompt
      setEditPrompt('');
      
      // Animate the new image
      animateImage();
      
      Alert.alert('Success', 'Image edited successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to edit image');
    } finally {
      setIsEditing(false);
    }
  };
  
  // Generate variations of the image
  const handleGenerateVariations = async () => {
    if (!apiKey) {
      Alert.alert('API Key Required', 'Please set your Replicate API key in the settings');
      return;
    }
    
    try {
      setIsEditing(true);
      setEditMode('variations');
      
      const result = await generateVariations(image.url);
      
      // Result should be an array of image URLs
      if (Array.isArray(result) && result.length > 0) {
        setVariations(result);
      } else {
        throw new Error('No variations generated');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate variations');
      setEditMode('text'); // Switch back to text mode on error
    } finally {
      setIsEditing(false);
    }
  };
  
  // Select a variation to use
  const handleSelectVariation = (variationUrl) => {
    setSelectedVariation(variationUrl);
  };
  
  // Apply the selected variation
  const handleApplyVariation = () => {
    if (!selectedVariation) {
      Alert.alert('Error', 'Please select a variation');
      return;
    }
    
    // Save the edited image
    saveEditedImage(image.id, selectedVariation, 'Image variation');
    
    // Update the local state
    setImage({
      ...image,
      url: selectedVariation,
    });
    
    // Reset variations
    setVariations([]);
    setSelectedVariation(null);
    setEditMode('text');
    
    // Animate the new image
    animateImage();
    
    Alert.alert('Success', 'Variation applied successfully');
  };
  
  // Cancel variations mode
  const handleCancelVariations = () => {
    setVariations([]);
    setSelectedVariation(null);
    setEditMode('text');
  };
  
  if (!image) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Image Editor</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Original Prompt */}
        <View style={styles.promptContainer}>
          <Text style={styles.promptLabel}>Original Prompt:</Text>
          <Text style={styles.promptText}>{image.prompt}</Text>
        </View>
        
        {/* Image Preview */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Image 
            source={{ uri: image.url }} 
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Edit History */}
        {image.edits && image.edits.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Edit History:</Text>
            {image.edits.map((edit, index) => (
              <View key={edit.id} style={styles.historyItem}>
                <Text style={styles.historyNumber}>{index + 1}.</Text>
                <Text style={styles.historyPrompt}>{edit.prompt}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Edit Controls */}
        {editMode === 'text' ? (
          <View style={styles.editContainer}>
            <Text style={styles.editLabel}>Edit with text prompt:</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Describe how to edit the image..."
              placeholderTextColor="#999"
              value={editPrompt}
              onChangeText={setEditPrompt}
              multiline
              numberOfLines={3}
              editable={!isEditing}
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.editButton, isEditing && styles.disabledButton]}
                onPress={handleTextEdit}
                disabled={isEditing || !editPrompt.trim()}
              >
                {isEditing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="brush-outline" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Apply Edit</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.variationsButton, isEditing && styles.disabledButton]}
                onPress={handleGenerateVariations}
                disabled={isEditing}
              >
                <Ionicons name="copy-outline" size={18} color="#333" style={styles.buttonIcon} />
                <Text style={styles.variationsButtonText}>Generate Variations</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.variationsContainer}>
            <Text style={styles.variationsTitle}>Select a variation:</Text>
            
            {isEditing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>Generating variations...</Text>
              </View>
            ) : (
              <>
                <View style={styles.variationsGrid}>
                  {variations.map((variationUrl, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.variationItem,
                        selectedVariation === variationUrl && styles.selectedVariation,
                      ]}
                      onPress={() => handleSelectVariation(variationUrl)}
                    >
                      <Image
                        source={{ uri: variationUrl }}
                        style={styles.variationImage}
                        resizeMode="cover"
                      />
                      {selectedVariation === variationUrl && (
                        <View style={styles.selectedOverlay}>
                          <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.editButton, !selectedVariation && styles.disabledButton]}
                    onPress={handleApplyVariation}
                    disabled={!selectedVariation}
                  >
                    <Ionicons name="checkmark-outline" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Apply Variation</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelVariations}
                  >
                    <Ionicons name="close-outline" size={18} color="#333" style={styles.buttonIcon} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  promptContainer: {
    marginBottom: 16,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  imageContainer: {
    marginVertical: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: width * 0.8,
  },
  historyContainer: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  historyNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  historyPrompt: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  editContainer: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  variationsButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  variationsButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  variationsContainer: {
    marginBottom: 20,
  },
  variationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  variationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  variationItem: {
    width: (width - 48) / 2,
    height: (width - 48) / 2,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  variationImage: {
    width: '100%',
    height: '100%',
  },
  selectedVariation: {
    borderWidth: 3,
    borderColor: '#333',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default ImageEditorScreen;
