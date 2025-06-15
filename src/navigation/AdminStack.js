// src/navigation/AdminStack.js - NAVIGATION COMPLÈTE AVEC TOUS LES ÉCRANS
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// ✅ ÉCRANS ADMIN PRINCIPAUX
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import ClientManagementScreen from '../screens/Admin/ClientManagementScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen';

// ✅ ÉCRANS DE DÉTAILS ET CRÉATION
import CollecteurDetailScreen from '../screens/Admin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/Admin/CollecteurCreationScreen';
import ClientDetailScreen from '../screens/Admin/ClientDetailScreen';
import TransactionDetailScreen from '../screens/Admin/TransactionDetailScreen';

// ✅ ÉCRANS OUTILS ADMINISTRATIFS
import CommissionParametersScreen from '../screens/Admin/CommissionParametersScreen';
import TransfertCompteScreen from '../screens/Admin/TransfertCompteScreen';
import JournalClotureScreen from '../screens/Admin/JournalClotureScreen';
import CommissionCalculationScreen from '../screens/Admin/CommissionCalculationScreen';

// ✅ ÉCRANS COMMUNS
import NotificationsScreen from '../screens/Common/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ✅ NAVIGATION PAR ONGLETS ADMIN
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'AdminDashboard':
              iconName = focused ? 'speedometer' : 'speedometer-outline';
              break;
            case 'CollecteurManagement':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'ClientManagement':
              iconName = focused ? 'person-add' : 'person-add-outline';
              break;
            case 'Reports':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Tableau de bord',
        }}
      />
      
      <Tab.Screen 
        name="CollecteurManagement" 
        component={CollecteurManagementScreen}
        options={{
          tabBarLabel: 'Collecteurs',
        }}
      />
      
      <Tab.Screen 
        name="ClientManagement" 
        component={ClientManagementScreen}
        options={{
          tabBarLabel: 'Clients',
        }}
      />
      
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Rapports',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
}

// ✅ STACK PRINCIPAL ADMIN AVEC TOUS LES ÉCRANS
export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {/* ✅ ÉCRAN PRINCIPAL AVEC ONGLETS */}
      <Stack.Screen 
        name="AdminTabs" 
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      
      {/* ✅ ÉCRANS DE GESTION DES COLLECTEURS */}
      <Stack.Screen 
        name="CollecteurCreationScreen" 
        component={CollecteurCreationScreen}
        options={{
          title: 'Nouveau collecteur',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen 
        name="CollecteurDetailScreen" 
        component={CollecteurDetailScreen}
        options={{
          title: 'Détails collecteur',
        }}
      />
      
      {/* ✅ ÉCRANS DE GESTION DES CLIENTS */}
      <Stack.Screen 
        name="ClientDetailScreen" 
        component={ClientDetailScreen}
        options={{
          title: 'Détails client',
        }}
      />
      
      {/* ✅ ÉCRANS DE TRANSACTIONS */}
      <Stack.Screen 
        name="TransactionDetailScreen" 
        component={TransactionDetailScreen}
        options={{
          title: 'Détails transaction',
        }}
      />
      
      {/* ✅ ÉCRANS OUTILS ADMINISTRATIFS */}
      <Stack.Screen 
        name="CommissionParametersScreen" 
        component={CommissionParametersScreen}
        options={{
          title: 'Paramètres de commissions',
        }}
      />
      
      <Stack.Screen 
        name="TransfertCompteScreen" 
        component={TransfertCompteScreen}
        options={{
          title: 'Transfert de comptes',
        }}
      />
      
      <Stack.Screen 
        name="JournalClotureScreen" 
        component={JournalClotureScreen}
        options={{
          title: 'Journal & Clôture',
        }}
      />
      
      <Stack.Screen 
        name="CommissionCalculationScreen" 
        component={CommissionCalculationScreen}
        options={{
          title: 'Calcul des commissions',
        }}
      />
      
      {/* ✅ ÉCRANS COMMUNS */}
      <Stack.Screen 
        name="NotificationsScreen" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}