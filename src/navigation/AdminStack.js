// src/navigation/AdminStack.js - STACK ADMIN CORRIGÉ
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// ✅ ÉCRANS ADMIN CORRIGÉS
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import ProfileScreen from '../screens/Collecteur/ProfileScreen'; // Réutilisé

// Écrans de détails
import CollecteurDetailScreen from '../screens/Admin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/Admin/CollecteurCreationScreen';
import CommissionParametersScreen from '../screens/Admin/CommissionParametersScreen';
import TransfertCompteScreen from '../screens/Admin/TransfertCompteScreen';
import CollecteurClientsScreen from '../screens/Admin/CollecteurClientsScreen';
import JournalClotureScreen from '../screens/Admin/JournalClotureScreen';
import CommissionCalculationScreen from '../screens/Admin/CommissionCalculationScreen';

// Écrans communs
import NotificationsScreen from '../screens/Comon/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ✅ TABS ADMIN SPÉCIFIQUES
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
            case 'Reports':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
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
      })}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
        options={{ title: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="CollecteurManagement" 
        component={CollecteurManagementScreen} 
        options={{ title: 'Collecteurs' }} 
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ title: 'Rapports' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profil' }} 
      />
    </Tab.Navigator>
  );
}

// ✅ STACK ADMIN PRINCIPAL
export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs principales */}
      <Stack.Screen 
        name="AdminTabs" 
        component={AdminTabs} 
      />
	  <Stack.Screen 
        name="JournalClotureScreen" 
        component={JournalClotureScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="CommissionCalculationScreen" 
        component={CommissionCalculationScreen}
        options={{ presentation: 'card' }}
      />
      
      {/* Écrans modaux et de détails */}
      <Stack.Screen 
        name="CollecteurDetailScreen" 
        component={CollecteurDetailScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="CollecteurCreationScreen" 
        component={CollecteurCreationScreen}
        options={{ presentation: 'modal' }}
      />
      
      <Stack.Screen 
        name="CollecteurEditScreen" 
        component={CollecteurCreationScreen}
        options={{ presentation: 'modal' }}
      />
      
      <Stack.Screen 
        name="CollecteurClientsScreen" 
        component={CollecteurClientsScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="CommissionParametersScreen" 
        component={CommissionParametersScreen}
        options={{ presentation: 'card' }}
      />
      
      <Stack.Screen 
        name="TransfertCompteScreen" 
        component={TransfertCompteScreen}
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