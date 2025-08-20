// src/navigation/SuperAdminStack.js 
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Écrans super admin (ajustez selon vos fichiers)
import SuperAdminDashboardScreen from '../screens/SuperAdmin/SuperAdminDashboardScreen';
import AgenceManagementScreen from '../screens/SuperAdmin/AgenceManagementScreen';
import AdminManagementScreen from '../screens/SuperAdmin/AdminManagementScreen';
import UserManagementScreen from '../screens/SuperAdmin/UserManagementScreen';

// Écrans de détails super admin
import AgenceDetailScreen from '../screens/SuperAdmin/AgenceDetailScreen';
import AgenceCreationScreen from '../screens/SuperAdmin/AgenceCreationScreen';
import AdminDetailScreen from '../screens/SuperAdmin/AdminDetailScreen';
import AdminCreationScreen from '../screens/SuperAdmin/AdminCreationScreen';
import CollecteurConsultationScreen from '../screens/SuperAdmin/CollecteurConsultationScreen';
import CollecteurDetailScreen from '../screens/SuperAdmin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/SuperAdmin/CollecteurCreationScreen';
import ClientConsultationScreen from '../screens/SuperAdmin/ClientConsultationScreen';
import ClientDetailScreen from '../screens/SuperAdmin/ClientDetailScreen';
import CommissionManagementScreen from '../screens/SuperAdmin/CommissionManagementScreen';
import CommissionTestScreen from '../screens/SuperAdmin/CommissionTestScreen';
import CollecteurMonitoringScreen from '../screens/SuperAdmin/CollecteurMonitoringScreen';
import ExportExcelScreen from '../screens/SuperAdmin/ExportExcelScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SuperAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'SuperAdminDashboard':
              iconName = focused ? 'speedometer' : 'speedometer-outline';
              break;
            case 'AgenceManagement':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'AdminManagement':
              iconName = focused ? 'shield' : 'shield-outline';
              break;
            case 'UserManagement':
              iconName = focused ? 'people-circle' : 'people-circle-outline';
              break;
            case 'CollecteurConsultation':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'ExportExcel':
              iconName = focused ? 'download' : 'download-outline';
              break;
            case 'CollecteurMonitoring':
              iconName = focused ? 'analytics' : 'analytics-outline';
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
        name="SuperAdminDashboard" 
        component={SuperAdminDashboardScreen} 
        options={{ title: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="AgenceManagement" 
        component={AgenceManagementScreen} 
        options={{ title: 'Agences' }} 
      />
      <Tab.Screen 
        name="AdminManagement" 
        component={AdminManagementScreen} 
        options={{ title: 'Admins' }} 
      />
      <Tab.Screen 
        name="UserManagement" 
        component={UserManagementScreen} 
        options={{ title: 'Utilisateurs' }} 
      />
      <Tab.Screen 
        name="CollecteurConsultation" 
        component={CollecteurConsultationScreen} 
        options={{ title: 'Collecteurs' }} 
      />
      <Tab.Screen 
        name="ExportExcel" 
        component={ExportExcelScreen} 
        options={{ title: 'Export' }} 
      />
      <Tab.Screen 
        name="CollecteurMonitoring" 
        component={CollecteurMonitoringScreen} 
        options={{ title: 'Monitoring' }} 
      />
    </Tab.Navigator>
  );
}

export default function SuperAdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabs} />
      
      {/* Écrans de détails super admin */}
      <Stack.Screen name="AgenceDetail" component={AgenceDetailScreen} />
      <Stack.Screen name="AgenceCreation" component={AgenceCreationScreen} />
      <Stack.Screen name="AdminDetail" component={AdminDetailScreen} />
      <Stack.Screen name="AdminCreation" component={AdminCreationScreen} />
      
      {/* Écrans de détails pour navigation depuis AgenceDetail */}
      <Stack.Screen name="CollecteurDetail" component={CollecteurDetailScreen} />
      <Stack.Screen name="CollecteurCreation" component={CollecteurCreationScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <Stack.Screen name="CommissionManagement" component={CommissionManagementScreen} />
      <Stack.Screen name="CommissionTest" component={CommissionTestScreen} />
      
      {/* Écrans de gestion collecteurs */}
      <Stack.Screen name="CollecteurManagementScreen" component={CollecteurConsultationScreen} />
    </Stack.Navigator>
  );
}