// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../screens/LoadingScreen';
import AuthStack from './AuthStack';
import AdminStack from './AdminStack';
import SuperAdminStack from './SuperAdminStack';
import CollecteurStack from './CollecteurStack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('🚀 AppNavigator - État:', { 
    isAuthenticated, 
    loading, 
    userRole: user?.role,
    userId: user?.id 
  });

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        console.log('🔄 Navigation State Changed:', JSON.stringify(state, null, 2));
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            {/* Route basée sur le rôle */}
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
    </NavigationContainer>
  );
}