import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

// Pour le développement, vous pouvez temporairement modifier cette valeur
const IS_TESTING = false; // Changez en true pour accéder directement aux tests

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        {IS_TESTING ? (
          // Écran de test sans dépendances complexes
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Mode Test - Modifiez IS_TESTING dans App.js</Text>
          </View>
        ) : (
          <AppNavigator />
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}