// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../screens/LoadingScreen';
import AuthStack from './AuthStack';
import AdminTabs from './AdminTabs';
import CollecteurTabs from './CollecteurTabs';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : user?.role === 'COLLECTEUR' ? (
          <Stack.Screen name="CollecteurTabs" component={CollecteurTabs} />
        ) : (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}