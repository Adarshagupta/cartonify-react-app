import { registerRootComponent } from 'expo';
import React from 'react';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
};

export default registerRootComponent(App);
