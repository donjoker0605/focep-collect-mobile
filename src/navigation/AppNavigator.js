// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Stacks de navigation
import AuthStack from './AuthStack';
import CollecteurStack from './CollecteurStack';
import AdminStack from './AdminStack';
import SuperAdminStack from './SuperAdminStack';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Stack d'authentification
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        // Stacks selon le rôle utilisateur
        <>
          {(user?.role === 'COLLECTEUR' || user?.role === 'ROLE_COLLECTEUR') && (
            <Stack.Screen name="Collecteur" component={CollecteurStack} />
          )}
          {(user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
            <Stack.Screen name="Admin" component={AdminStack} />
          )}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN') && (
            <Stack.Screen name="SuperAdmin" component={SuperAdminStack} />
          )}
          {/* Fallback pour rôles non gérés */}
          {!['COLLECTEUR', 'ROLE_COLLECTEUR', 'ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'ROLE_SUPER_ADMIN'].includes(user?.role) && (
            <Stack.Screen name="Collecteur" component={CollecteurStack} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}