// App.js
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { EventEmitter } from 'events';
import AsyncStorage from '../utils/storage';
import Constants from 'expo-constants';

// Composants personnalisés
import ErrorBoundary from './src/components/ErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import AppWrapper from './src/components/AppWrapper';

// Configuration
import { APP_CONFIG } from './src/config/appConfig';
import { debugApiConfig } from './src/config/apiConfig';

// Services
import errorService from './src/services/errorService';
import cacheService from './src/services/cacheService';
import imageCacheService from './src/services/imageCache';

// Theme
import { theme } from './src/theme/theme';

// Créer des émetteurs d'événements globaux pour l'authentification et la synchronisation
if (!global.authEventEmitter) {
  global.authEventEmitter = new EventEmitter();
}

if (!global.syncEventEmitter) {
  global.syncEventEmitter = new EventEmitter();
}

// Pour le développement, vous pouvez temporairement modifier cette valeur
const IS_TESTING = false; // Changez en true pour accéder directement aux tests

// Empêcher l'écran de démarrage de se cacher automatiquement
SplashScreen.preventAutoHideAsync().catch(() => {
  // Si ça échoue, ce n'est pas critique
});

export default function App() {
  // Initialisation de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier si une mise à jour est disponible (en production uniquement)
        if (APP_CONFIG.isProduction && !__DEV__) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            }
          } catch (updateError) {
            // Les erreurs de mise à jour ne sont pas critiques
            console.log('Error checking for updates:', updateError);
          }
        }

        // Nettoyage du cache obsolète (en arrière-plan)
        setTimeout(async () => {
          try {
            // Nettoyage du cache API
            await cacheService.cleanup();
            
            // Nettoyage du cache d'images
            await imageCacheService.cleanOldCache(7); // 7 jours
            
            // Log des statistiques de cache en développement
            if (__DEV__) {
              const cacheStats = await cacheService.getStats();
              console.log('Cache API stats:', cacheStats);
              
              const cacheSize = await imageCacheService.getCacheSize();
              console.log('Image cache size:', (cacheSize / 1024 / 1024).toFixed(2) + ' MB');
            }
          } catch (cacheError) {
            console.log('Cache cleanup error:', cacheError);
          }
        }, 2000); // Délai pour permettre à l'application de se lancer d'abord
        
        // Enregistrer les informations de l'application pour le reporting d'erreurs
        errorService.initializeApp({
          appVersion: APP_CONFIG.appVersion,
          appBuild: APP_CONFIG.appBuild,
          environment: APP_CONFIG.environment,
        });
        
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Masquer l'écran de démarrage une fois l'initialisation terminée
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          // Si ça échoue, ce n'est pas critique
        }
      }
    };

    initializeApp();
    
    // Nettoyage
    return () => {
      // Supprimer les écouteurs d'événements si nécessaire
    };
  }, []);
  
  useEffect(() => {
  debugApiConfig();
}, []);
  
  // Afficher un message spécial en mode développement
  if (__DEV__ && APP_CONFIG.environment === 'development') {
    console.log(`🚀 Application lancée en mode ${APP_CONFIG.environment}`);
    console.log(`📡 API URL: ${APP_CONFIG.apiBaseUrl}`);
    console.log(`🔧 Mock API: ${APP_CONFIG.useMockData ? 'Activé' : 'Désactivé'}`);
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <AuthProvider>
            <AppWrapper>
              {IS_TESTING ? (
                // Écran de test sans dépendances complexes
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Mode Test - Modifiez IS_TESTING dans App.js</Text>
                </View>
              ) : (
                <AppNavigator />
              )}
            </AppWrapper>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}