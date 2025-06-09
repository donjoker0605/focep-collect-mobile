// src/navigation/AppNavigator.js - VERSION CORRIGÉE
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Navigation stacks
import MainNavigator from './MainNavigator'; // Pour les collecteurs
import LoginScreen from '../screens/Auth/LoginScreen';
// TODO: Créer AdminStack et SuperAdminStack plus tard

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
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        // Stacks selon le rôle utilisateur
        <>
          {(user?.role === 'COLLECTEUR' || user?.role === 'ROLE_COLLECTEUR') && (
            <Stack.Screen name="Main" component={MainNavigator} />
          )}
          {/* TODO: Ajouter AdminStack et SuperAdminStack 
          {user?.role === 'ADMIN' && (
            <Stack.Screen name="Admin" component={AdminStack} />
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <Stack.Screen name="SuperAdmin" component={SuperAdminStack} />
          )}
          */}
          {/* Fallback pour les rôles non gérés */}
          {!['COLLECTEUR', 'ROLE_COLLECTEUR', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
            <Stack.Screen name="Main" component={MainNavigator} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}