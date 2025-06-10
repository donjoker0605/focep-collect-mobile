// src/navigation/AppNavigator.js - NAVIGATION PRINCIPALE CORRIGÉE
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Stacks de navigation
import AuthStack from './AuthStack';
import CollecteurStack from './CollecteurStack';
import AdminStack from './AdminStack'; // ✅ IMPORT CORRIGÉ

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('🔍 AppNavigator - User:', { 
    isAuthenticated, 
    role: user?.role, 
    email: user?.email 
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        // ✅ CORRECTION CRITIQUE : REDIRECTION SELON LE RÔLE RÉEL
        <>
          {(user?.role === 'ROLE_COLLECTEUR') && (
            <Stack.Screen name="Collecteur" component={CollecteurStack} />
          )}
          
          {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN') && (
            <Stack.Screen name="Admin" component={AdminStack} />
          )}
          
          {/* Fallback sécurisé */}
          {!['ROLE_COLLECTEUR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(user?.role) && (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}