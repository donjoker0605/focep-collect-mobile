// src/navigation/CollecteurTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

// Import des écrans principaux
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteScreen from '../screens/Collecteur/CollecteScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function CollecteurTabs() {
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
            case 'ClientList':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Collecte':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Journal':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
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
      <Tab.Screen 
        name="ClientList" 
        component={ClientListScreen} 
        options={{ tabBarLabel: 'Clients' }}
      />
      <Tab.Screen 
        name="Collecte" 
        component={CollecteScreen} 
        options={{ tabBarLabel: 'Collecte' }}
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalScreen} 
        options={{ tabBarLabel: 'Journal' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}