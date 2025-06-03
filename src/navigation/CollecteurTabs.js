// src/navigation/CollecteurTabs.js - CORRECTION CRITIQUE
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Écrans principaux
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteScreen from '../screens/Collecteur/CollecteScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfilScreen from '../screens/Collecteur/ProfilScreen';

import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';

import theme from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ClientStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClientList" component={ClientListScreen} />
    <Stack.Screen 
      name="ClientDetail" 
      component={ClientDetailScreen}
      options={{
        headerShown: false,
        initialParams: {},
      }}
    />
    <Stack.Screen name="ClientAddEdit" component={ClientAddEditScreen} />
  </Stack.Navigator>
);

const CollecteStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Collecte" component={CollecteScreen} />
    <Stack.Screen 
      name="CollecteDetail" 
      component={CollecteDetailScreen}
      options={{
        headerShown: false,
        initialParams: {},
      }}
    />
  </Stack.Navigator>
);

const JournalStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Journal" component={JournalScreen} />
  </Stack.Navigator>
);

const CollecteurTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ClientsTab': 
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'CollecteTab':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'JournalTab':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profil':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.lightGray,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarLabel: 'Accueil' }}
      />
      
      {/*Utilise ClientStack au lieu de ClientListScreen */}
      <Tab.Screen 
        name="ClientsTab" 
        component={ClientStack} 
        options={{ tabBarLabel: 'Clients' }}
      />
      
      {/* Utilise CollecteStack au lieu de CollecteScreen */}
      <Tab.Screen 
        name="CollecteTab" 
        component={CollecteStack} 
        options={{ tabBarLabel: 'Collecte' }}
      />
      
      <Tab.Screen 
        name="JournalTab" 
        component={JournalStack} 
        options={{ tabBarLabel: 'Journal' }}
      />
      
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen} 
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default CollecteurTabs;