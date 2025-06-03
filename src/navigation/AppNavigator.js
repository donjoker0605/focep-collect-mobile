// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../screens/LoadingScreen';
import AuthStack from './AuthStack';
import AdminTabs from './AdminTabs';

// IMPORT DIRECT DE TOUS LES ÉCRANS
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteScreen from '../screens/Collecteur/CollecteScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfilScreen from '../screens/Collecteur/ProfilScreen';
import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';

import theme from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// NAVIGATION STACK UNIQUE - SOLUTION DÉFINITIVE
const CollecteurNavigator = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      // ✅ ANIMATIONS FLUIDES
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
    {/* ✅ ÉCRAN PRINCIPAL AVEC TABS */}
    <Stack.Screen name="MainTabs" component={CollecteurTabs} />
    
    {/* ✅ ÉCRANS DÉTAILS - DANS LE MÊME STACK */}
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
  </Stack.Navigator>
);

// TABS SIMPLES - SANS STACKS IMBRIQUÉS
const CollecteurTabs = () => (
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
      name="Profil" 
      component={ProfilScreen} 
      options={{ tabBarLabel: 'Profil' }}
    />
  </Tab.Navigator>
);

// APP NAVIGATOR PRINCIPAL SIMPLIFIÉ
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
        ) : user?.role === 'COLLECTEUR' || user?.role === 'ROLE_COLLECTEUR' ? (
          <Stack.Screen name="Collecteur" component={CollecteurNavigator} />
        ) : (
          <Stack.Screen name="Admin" component={AdminTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}