// App.js
import 'react-native-gesture-handler'; // ✅ OBLIGATOIRE en premier pour React Navigation
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// ✅ Import corrigé - sans destructuring
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';

// ✅ Services essentiels seulement
import { APP_CONFIG } from './src/config/appConfig';

// Empêcher l'écran de démarrage de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // ✅ Initialisation minimale et rapide
        console.log(`🚀 Application lancée en mode ${APP_CONFIG.environment}`);
        console.log(`📡 API URL: ${APP_CONFIG.apiBaseUrl}`);
        
        // ✅ Délai minimal pour permettre le chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // ✅ Masquer l'écran de démarrage
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}