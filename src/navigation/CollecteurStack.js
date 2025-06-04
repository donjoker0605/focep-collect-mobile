// src/navigation/CollecteurStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CollecteurTabs from './CollecteurTabs';

// Import de tous les écrans
import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';
import NotificationsScreen from '../screens/Common/NotificationsScreen';

const Stack = createStackNavigator();

export default function CollecteurStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        // Animations fluides
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      {/* ÉCRAN PRINCIPAL AVEC TABS */}
      <Stack.Screen 
        name="MainTabs" 
        component={CollecteurTabs}
        options={{ headerShown: false }}
      />
      
      {/* ÉCRANS DÉTAILS */}
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      
      <Stack.Screen 
        name="ClientAddEdit" 
        component={ClientAddEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen 
        name="CollecteDetail" 
        component={CollecteDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}