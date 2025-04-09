import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ragService from '../services/RAGService';

const RAGManagementScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [shortTermMemory, setShortTermMemory] = useState([]);
  const [longTermMemory, setLongTermMemory] = useState([]);
  const [vectorCount, setVectorCount] = useState(0);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await ragService.initialize();
      
      // Get memory data
      setShortTermMemory(ragService.memory.shortTerm);
      setLongTermMemory(ragService.memory.longTerm);
      
      // Get vector count
      setVectorCount(ragService.vectorDB.vectors.length);
    } catch (error) {
      console.error('Error loading RAG data:', error);
      Alert.alert('Error', 'Failed to load memory data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMemory = () => {
    Alert.alert(
      'Clear Memory',
      'Are you sure you want to clear all memory? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await ragService.clearAll();
              setShortTermMemory([]);
              setLongTermMemory([]);
              setVectorCount(0);
              Alert.alert('Success', 'Memory cleared successfully');
            } catch (error) {
              console.error('Error clearing memory:', error);
              Alert.alert('Error', 'Failed to clear memory');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderMemoryItem = (item, index) => {
    if (item.type === 'user_message' || item.type === 'assistant_response' || !item.type) {
      return (
        <View key={index} style={styles.memoryItem}>
          <Text style={styles.memoryRole}>
            {item.role === 'user' ? 'User' : 'Assistant'}:
          </Text>
          <Text style={styles.memoryContent}>{item.content}</Text>
          <Text style={styles.memoryTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      );
    } else if (item.type === 'image_generation' || item.type === 'generated_image') {
      return (
        <View key={index} style={styles.memoryItem}>
          <Text style={styles.memoryRole}>Image Generation:</Text>
          <Text style={styles.memoryContent}>{item.prompt}</Text>
          <Text style={styles.memoryTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      );
    } else if (item.type === 'fact') {
      return (
        <View key={index} style={styles.memoryItem}>
          <Text style={styles.memoryRole}>Remembered Fact:</Text>
          <Text style={styles.memoryContent}>{item.content}</Text>
          <Text style={styles.memoryTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading memory data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Memory Management</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Short-term Memory</Text>
            <Text style={styles.statValue}>{shortTermMemory.length} items</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Long-term Memory</Text>
            <Text style={styles.statValue}>{longTermMemory.length} items</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Vector Database</Text>
            <Text style={styles.statValue}>{vectorCount} entries</Text>
          </View>
        </View>
        
        {/* Actions Section */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={loadData}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearMemory}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Advanced Mode Toggle */}
        <View style={styles.advancedModeContainer}>
          <Text style={styles.advancedModeLabel}>Advanced Mode</Text>
          <Switch
            value={isAdvancedMode}
            onValueChange={setIsAdvancedMode}
            trackColor={{ false: '#ccc', true: '#333' }}
            thumbColor="#fff"
          />
        </View>
        
        {/* Memory Sections */}
        {isAdvancedMode && (
          <>
            {/* Long-term Memory Section */}
            <View style={styles.memorySection}>
              <Text style={styles.sectionTitle}>Long-term Memory</Text>
              {longTermMemory.length > 0 ? (
                longTermMemory.map((item, index) => renderMemoryItem(item, index))
              ) : (
                <Text style={styles.emptyText}>No long-term memories yet</Text>
              )}
            </View>
            
            {/* Short-term Memory Section */}
            <View style={styles.memorySection}>
              <Text style={styles.sectionTitle}>Recent Conversations</Text>
              {shortTermMemory.length > 0 ? (
                shortTermMemory.map((item, index) => renderMemoryItem(item, index))
              ) : (
                <Text style={styles.emptyText}>No recent conversations</Text>
              )}
            </View>
          </>
        )}
        
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About RAG Memory</Text>
          <Text style={styles.infoText}>
            Cartonify uses Retrieval-Augmented Generation (RAG) to provide context-aware responses.
            The app remembers your conversations and generated images to provide more personalized
            and relevant responses over time.
          </Text>
          <Text style={styles.infoText}>
            • Short-term memory stores recent conversations
          </Text>
          <Text style={styles.infoText}>
            • Long-term memory stores important facts and preferences
          </Text>
          <Text style={styles.infoText}>
            • Vector database enables semantic search of past interactions
          </Text>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
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
  clearButton: {
    backgroundColor: '#e53935',
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  advancedModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  advancedModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memorySection: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  memoryItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memoryRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memoryContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memoryTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default RAGManagementScreen;
