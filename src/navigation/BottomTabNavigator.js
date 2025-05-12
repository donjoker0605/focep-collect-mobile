import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importation des écrans
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteJournaliereScreen from '../screens/Collecteur/CollecteJournaliereScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';

import theme from '../theme';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Collecte') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'Journal') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 10,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderRadius: 30,
          marginHorizontal: 16,
          marginBottom: 16,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={ClientListScreen} 
        options={{ title: 'Analyses' }}
      />
      <Tab.Screen 
        name="Collecte" 
        component={CollecteJournaliereScreen} 
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
};

export default BottomTabNavigator;