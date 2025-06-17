// src/navigation/AdminStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// ÉCRANS ADMIN PRINCIPAUX
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import ClientManagementScreen from '../screens/Admin/ClientManagementScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen';

// ÉCRANS DE DÉTAILS ET CRÉATION
import CollecteurDetailScreen from '../screens/Admin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/Admin/CollecteurCreationScreen';
import ClientDetailScreen from '../screens/Admin/ClientDetailScreen';
import TransactionDetailScreen from '../screens/Admin/TransactionDetailScreen';

// ÉCRANS OUTILS ADMINISTRATIFS
import CommissionParametersScreen from '../screens/Admin/CommissionParametersScreen';
import TransfertCompteScreen from '../screens/Admin/TransfertCompteScreen';
import JournalClotureScreen from '../screens/Admin/JournalClotureScreen';
import CommissionCalculationScreen from '../screens/Admin/CommissionCalculationScreen';

// ÉCRANS COMMUNS
import NotificationsScreen from '../screens/Comon/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Navigation par onglets
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

// Stack principal avec tous les écrans
export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {/* Écran principal avec onglets */}
      <Stack.Screen 
        name="AdminTabs" 
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      
      {/* TOUS LES ÉCRANS DE NAVIGATION */}
      <Stack.Screen 
        name="CollecteurManagementScreen" 
        component={CollecteurManagementScreen}
        options={{
          title: 'Gestion des collecteurs',
        }}
      />
      
      <Stack.Screen 
        name="ClientManagementScreen" 
        component={ClientManagementScreen}
        options={{
          title: 'Gestion des clients',
        }}
      />
      
      <Stack.Screen 
        name="ReportsScreen" 
        component={ReportsScreen}
        options={{
          title: 'Rapports',
        }}
      />
      
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
      
      <Stack.Screen 
        name="ClientDetailScreen" 
        component={ClientDetailScreen}
        options={{
          title: 'Détails client',
        }}
      />
      
      <Stack.Screen 
        name="TransactionDetailScreen" 
        component={TransactionDetailScreen}
        options={{
          title: 'Détails transaction',
        }}
      />
      
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