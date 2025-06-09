// src/navigation/AdminStack.js 
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Écrans admin (ajustez les imports selon vos fichiers)
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import ParameterManagementScreen from '../screens/Admin/ParameterManagementScreen';

// Écrans de détails admin
import CollecteurDetailScreen from '../screens/Admin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/Admin/CollecteurCreationScreen';
import CollecteurClientsScreen from '../screens/Admin/CollecteurClientsScreen';
import TransfertCompteScreen from '../screens/Admin/TransfertCompteScreen';
import CommissionParametersScreen from '../screens/Admin/CommissionParametersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'AdminDashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'CollecteurManagement':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Parameters':
              iconName = focused ? 'settings' : 'settings-outline';
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
        name="Parameters" 
        component={ParameterManagementScreen} 
        options={{ title: 'Paramètres' }} 
      />
    </Tab.Navigator>
  );
}

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      
      {/* Écrans de détails admin */}
      <Stack.Screen name="CollecteurDetail" component={CollecteurDetailScreen} />
      <Stack.Screen name="CollecteurCreation" component={CollecteurCreationScreen} />
      <Stack.Screen name="CollecteurClients" component={CollecteurClientsScreen} />
      <Stack.Screen name="TransfertCompte" component={TransfertCompteScreen} />
      <Stack.Screen name="CommissionParameters" component={CommissionParametersScreen} />
    </Stack.Navigator>
  );
}