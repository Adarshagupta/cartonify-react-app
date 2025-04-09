import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GalleryScreen from '../screens/GalleryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import ImageEditorScreen from '../screens/ImageEditorScreen';
import RAGManagementScreen from '../screens/RAGManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create stack navigators for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
  </Stack.Navigator>
);

const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatScreen" component={ChatScreen} />
  </Stack.Navigator>
);

const GalleryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GalleryScreen" component={GalleryScreen} />
    <Stack.Screen name="ImageEditor" component={ImageEditorScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="RAGManagement" component={RAGManagementScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Gallery') {
              iconName = focused ? 'images' : 'images-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            // Custom tab bar icon with indicator for focused state
            return (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 50,
                height: 30,
              }}>
                <Ionicons name={iconName} size={24} color={color} />
                {focused && (
                  <View style={{
                    position: 'absolute',
                    bottom: -5,
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: color,
                  }} />
                )}
              </View>
            );
          },
          tabBarActiveTintColor: '#333',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: '#ffffff',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: -5,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ tabBarLabel: 'Create' }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatStack}
          options={{ tabBarLabel: 'Chat' }}
        />
        <Tab.Screen
          name="Gallery"
          component={GalleryStack}
          options={{ tabBarLabel: 'Gallery' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
