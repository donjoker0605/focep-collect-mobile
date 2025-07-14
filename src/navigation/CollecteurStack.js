// src/navigation/CollecteurStack.js - VERSION CORRIGÉE
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

// IMPORTATION DES ÉCRANS - Vérifier que ces écrans existent
import DashboardScreen from '../screens/Collecteur/DashboardScreen';
import ClientListScreen from '../screens/Collecteur/ClientListScreen';
import CollecteScreen from '../screens/Collecteur/CollecteScreen';
import JournalScreen from '../screens/Collecteur/JournalScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen';

// CRANS MODAUX ET DÉTAILS
import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen';
import JournalActiviteScreen from '../screens/Collecteur/JournalActiviteScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';
import TransactionDetailScreen from '../screens/Collecteur/TransactionDetailScreen'; 
import NotificationsScreen from '../screens/Comon/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============================================
// STACK NAVIGATEUR POUR LES CLIENTS
// ============================================
const ClientsStack = createNativeStackNavigator();

function ClientsStackNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientsStack.Screen 
        name="ClientList" 
        component={ClientListScreen}
        options={{ title: 'Liste des clients' }}
      />
      <ClientsStack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ presentation: 'card' }}
      />
      <ClientsStack.Screen 
        name="ClientAddEdit" 
        component={ClientAddEditScreen}
        options={{ presentation: 'modal' }}
      />
    </ClientsStack.Navigator>
  );
}

// ============================================
// TAB NAVIGATOR PRINCIPAL
// ============================================
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
      
      {/* CORRECTION CRUCIALE - Utiliser le Stack Navigator pour les clients */}
      <Tab.Screen 
        name="Clients" 
        component={ClientsStackNavigator}
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

// ============================================
// STACK PRINCIPAL COLLECTEUR
// ============================================
export default function CollecteurStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Stack principal avec tabs */}
      <Stack.Screen name="CollecteurTabs" component={CollecteurTabs} />
      
      {/* ÉCRANS MODAUX GLOBAUX */}
      
      {/* Journal d'Activité - accessible depuis plusieurs endroits */}
      <Stack.Screen 
        name="JournalActivite" 
        component={JournalActiviteScreen}
        options={{ 
          presentation: 'card',
          title: 'Journal d\'Activité' 
        }}
      />
      
      {/* Détails de collecte */}
      <Stack.Screen 
        name="CollecteDetail" 
        component={CollecteDetailScreen}
        options={{ 
          presentation: 'card',
          title: 'Détails Collecte' 
        }}
      />
      
      {/* Détails de transaction */}
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen}
        options={{ 
          presentation: 'card',
          title: 'Détails Transaction' 
        }}
      />
      
      {/* Notifications */}
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          presentation: 'card',
          title: 'Notifications' 
        }}
      />
    </Stack.Navigator>
  );
}

// ============================================
// FONCTIONS UTILITAIRES DE NAVIGATION
// ============================================

/**
 * Fonction utilitaire pour naviguer vers la création d'un client
 * À utiliser depuis n'importe quel écran
 */
export const navigateToAddClient = (navigation) => {
  // Naviguer vers l'onglet Clients puis vers l'écran d'ajout
  navigation.navigate('Clients', {
    screen: 'ClientAddEdit',
    params: { mode: 'add' }
  });
};

/**
 * Fonction utilitaire pour naviguer vers les détails d'un client
 * À utiliser depuis n'importe quel écran
 */
export const navigateToClientDetail = (navigation, client) => {
  navigation.navigate('Clients', {
    screen: 'ClientDetail',
    params: { client }
  });
};

/**
 * Fonction utilitaire pour naviguer vers l'édition d'un client
 * À utiliser depuis n'importe quel écran
 */
export const navigateToEditClient = (navigation, client) => {
  navigation.navigate('Clients', {
    screen: 'ClientAddEdit',
    params: { mode: 'edit', client }
  });
};

/**
 * Fonction utilitaire pour revenir à la liste des clients
 * À utiliser après une action (création, modification)
 */
export const navigateToClientList = (navigation) => {
  navigation.navigate('Clients', {
    screen: 'ClientList'
  });
};

/**
 * Hook personnalisé pour les actions de navigation fréquentes
 * Usage: const { goToAddClient, goToClientDetail } = useCollecteurNavigation(navigation);
 */
export const useCollecteurNavigation = (navigation) => {
  return {
    goToAddClient: () => navigateToAddClient(navigation),
    goToClientDetail: (client) => navigateToClientDetail(navigation, client),
    goToEditClient: (client) => navigateToEditClient(navigation, client),
    goToClientList: () => navigateToClientList(navigation),
    goBack: () => navigation.goBack(),
    goToNotifications: () => navigation.navigate('Notifications')
  };
};