// src/navigation/MainNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import des écrans principaux (Tabs)
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteScreen from '../screens/Collecteur/CollecteScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen';

// Import des écrans de détails (Stack)
import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';
import NotificationsScreen from '../screens/Common/NotificationsScreen';

// Import des écrans de fallback si certains n'existent pas encore
import { View, Text, StyleSheet } from 'react-native';

// Écrans de fallback temporaires
const FallbackScreen = ({ title }) => (
  <View style={styles.screen}>
    <Text style={styles.text}>{title}</Text>
    <Text style={styles.subText}>Écran en cours de développement</Text>
  </View>
);

// Wrapper pour gérer les écrans manquants
const SafeScreen = (ScreenComponent, fallbackTitle) => {
  if (ScreenComponent) {
    return ScreenComponent;
  }
  return () => <FallbackScreen title={fallbackTitle} />;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
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
        component={SafeScreen(DashboardScreen, 'Dashboard')} 
        options={{ title: 'Accueil' }} 
      />
      <Tab.Screen 
        name="Clients" 
        component={SafeScreen(ClientListScreen, 'Liste Clients')} 
        options={{ title: 'Clients' }} 
      />
      <Tab.Screen 
        name="Collecte" 
        component={SafeScreen(CollecteScreen, 'Collecte')} 
        options={{ title: 'Collecte' }} 
      />
      <Tab.Screen 
        name="Journal" 
        component={SafeScreen(JournalScreen, 'Journal')} 
        options={{ title: 'Journal' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={SafeScreen(ProfileScreen, 'Profil')} 
        options={{ title: 'Profil' }} 
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Animation fluide pour les transitions
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
      {/* Écran principal avec tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      
      {/* Écrans de détails et modaux */}
      <Stack.Screen 
        name="ClientDetail" 
        component={SafeScreen(ClientDetailScreen, 'Détails Client')}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      
      <Stack.Screen 
        name="ClientAddEdit" 
        component={SafeScreen(ClientAddEditScreen, 'Ajouter/Modifier Client')}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen 
        name="CollecteDetail" 
        component={SafeScreen(CollecteDetailScreen, 'Détails Collecte')}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      <Stack.Screen 
        name="Notifications" 
        component={SafeScreen(NotificationsScreen, 'Notifications')}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});