// App.js 
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const containerStyle = Platform.OS === 'web' ? {
    height: '100vh',
    width: '100vw'
  } : { flex: 1 };

  return (
    <View style={containerStyle}>
      <NavigationContainer>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </View>
  );
}