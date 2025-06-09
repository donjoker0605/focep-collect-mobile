// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import CollecteurStack from './CollecteurStack';
import AdminStack from './AdminStack';
import SuperAdminStack from './SuperAdminStack';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          {(user?.role === 'COLLECTEUR' || user?.role === 'ROLE_COLLECTEUR') && (
            <Stack.Screen name="Collecteur" component={CollecteurStack} />
          )}
          {user?.role === 'ADMIN' && (
            <Stack.Screen name="Admin" component={AdminStack} />
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <Stack.Screen name="SuperAdmin" component={SuperAdminStack} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}