// app/_layout.tsx
import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppWrapper from '../src/components/AppWrapper';

// Empêcher l'écran de splash de s'auto-masquer
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Masquer l'écran de démarrage après initialisation
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppWrapper>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
              <Stack.Screen name="admin" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="super-admin" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="client-detail" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="client-add-edit" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="collecte-detail" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </AppWrapper>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}