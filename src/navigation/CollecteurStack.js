// src/navigation/CollecteurStack.js
// REMPLACER tout le contenu par :

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

// Écrans de tabs collecteur
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteScreen from '../screens/Collecteur/CollecteScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen';
import JournalActiviteScreen from '../screens/Collecteur/JournalActiviteScreen';

// Écrans modaux et détails
import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';
import TransactionDetailScreen from '../screens/Collecteur/TransactionDetailScreen'; 
import NotificationsScreen from '../screens/Comon/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CollecteurTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Clients':
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
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.lightGray,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Accueil' }} 
      />
      <Tab.Screen 
        name="Clients" 
        component={ClientListScreen} 
        options={{ title: 'Clients' }} 
      />
      <Tab.Screen 
        name="Collecte" 
        component={CollecteScreen} 
        options={{ title: 'Collecte' }} 
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalScreen} 
        options={{ title: 'Journal' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profil' }} 
      />
    </Tab.Navigator>
  );
}

export default function CollecteurStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CollecteurTabs" component={CollecteurTabs} />
      
      {/* ✅ NOUVEAU - Écran Journal d'Activité */}
      <Stack.Screen 
        name="JournalActivite" 
        component={JournalActiviteScreen}
        options={{ presentation: 'card' }}
      />
      
      {/* Écrans modaux et de détails existants */}
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="ClientAddEdit" 
        component={ClientAddEditScreen}
        options={{ presentation: 'modal' }}
      />
      
      <Stack.Screen 
        name="CollecteDetail" 
        component={CollecteDetailScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
