import React, { useContext } from 'react';
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
} from 'react-native';
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

  const renderItem = ({ item }) => (
    <View style={styles.imageCard}>
      <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
      <View style={styles.imageInfo}>
        <Text style={styles.promptText} numberOfLines={2}>{item.prompt}</Text>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={() => handleShareImage(item.url)}
        >
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteImage(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Gallery</Text>
      
      {generatedImages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No images yet</Text>
          <Text style={styles.emptySubtext}>
            Generate some images to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={generatedImages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    margin: 20,
    marginBottom: 10,
  },
  listContent: {
    padding: 10,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageInfo: {
    padding: 15,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButton: {
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  deleteButton: {
    backgroundColor: '#fff0f0',
  },
  actionButtonText: {
    fontWeight: '500',
    color: '#6200ee',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default GalleryScreen;
