import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GalleryScreen from '../screens/GalleryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
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
          component={HomeScreen}
          options={{ tabBarLabel: 'Create' }}
        />
        <Tab.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{ tabBarLabel: 'Gallery' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
