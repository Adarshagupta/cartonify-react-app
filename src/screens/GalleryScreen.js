import React, { useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppContext from '../context/AppContext';

const GalleryScreen = () => {
  const { generatedImages, removeGeneratedImage } = useContext(AppContext);

  const handleShareImage = async (imageUrl) => {
    try {
      await Share.share({
        message: 'Check out this AI-generated image!',
        url: imageUrl,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleDeleteImage = (id) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => removeGeneratedImage(id), style: 'destructive' }
      ]
    );
  };

  const handleEditImage = (id) => {
    navigation.navigate('ImageEditor', { imageId: id });
  };

  const { width } = Dimensions.get('window');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderItem = ({ item, index }) => {
    // Stagger the animation of items
    const itemAnimationDelay = index * 100;

    return (
      <Animated.View
        style={[styles.imageCard, { opacity: fadeAnim }]}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.imageInfo}>
          <Text style={styles.promptText} numberOfLines={2}>{item.prompt}</Text>
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareImage(item.url)}
          >
            <Ionicons name="share-outline" size={18} color="#333" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditImage(item.id)}
          >
            <Ionicons name="brush-outline" size={18} color="#333" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteImage(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#333" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <View style={styles.headerRight}>
          {generatedImages.length > 0 && (
            <Text style={styles.imageCount}>
              {generatedImages.length} {generatedImages.length === 1 ? 'image' : 'images'}
            </Text>
          )}
        </View>
      </View>

      {generatedImages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color="#ddd" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No images yet</Text>
          <Text style={styles.emptySubtext}>
            Your generated images will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={generatedImages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#f9f9f9',
  },
  imageInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  promptText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default GalleryScreen;
