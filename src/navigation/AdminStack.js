// src/navigation/AdminStack.js - NAVIGATION ADMIN CORRIGÉE
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================= 
// IMPORTS DES ÉCRANS
// ============================= 

// Écrans principaux
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminNotificationsScreen from '../screens/Admin/AdminNotificationsScreen';
import AdminCollecteurSupervisionScreen from '../screens/Admin/AdminCollecteurSupervisionScreen';
import AdminJournalActiviteScreen from '../screens/Admin/AdminJournalActiviteScreen';

// Écrans de gestion des collecteurs
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import CollecteurDetailScreen from '../screens/Admin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/Admin/CollecteurCreationScreen';
import CollecteurClientsScreen from '../screens/Admin/CollecteurClientsScreen';

// Écrans de gestion des clients
import ClientManagementScreen from '../screens/Admin/ClientManagementScreen';
import ClientDetailScreen from '../screens/Admin/ClientDetailScreen';

// Écrans de rapports et commissions
import ReportsScreen from '../screens/Admin/ReportsScreen';
import CommissionCalculationScreen from '../screens/Admin/CommissionCalculationScreen';
import CommissionParametersScreen from '../screens/Admin/CommissionParametersScreen';
import CommissionReportScreen from '../screens/Admin/CommissionReportScreen';

// Écrans de transactions et transferts
import TransactionDetailScreen from '../screens/Admin/TransactionDetailScreen';
import TransfertCompteScreen from '../screens/Admin/TransfertCompteScreen';
import JournalClotureScreen from '../screens/Admin/JournalClotureScreen';

const Stack = createStackNavigator();

const AdminStack = () => {
  
  // FONCTION DE DÉCONNEXION
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              const { authService } = require('../services');
              await authService.logout();
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 2,
          shadowOpacity: 0.1,
        },
        headerTintColor: '#212529',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        cardStyle: {
          backgroundColor: '#f8f9fa',
        },
      }}
    >
      {/* ============================= */}
      {/* ÉCRANS PRINCIPAUX */}
      {/* ============================= */}
      
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={({ navigation }) => ({
          title: 'Tableau de bord',
          headerLeft: () => null, // Pas de bouton retour sur le dashboard
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16, padding: 8, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => navigation.navigate('AdminNotifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#007AFF" style={{ marginRight: 12 }} />
              <TouchableOpacity
                onPress={handleLogout}
                style={{ padding: 4 }}
              >
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />

      {/* ============================= */}
      {/* SUPERVISION DES COLLECTEURS */}
      {/* ============================= */}

      <Stack.Screen
        name="AdminCollecteurSupervision"
        component={AdminCollecteurSupervisionScreen}
        options={({ navigation }) => ({
          title: 'Supervision Collecteurs',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16, padding: 8 }}
              onPress={() => {
                navigation.setParams({ refresh: Date.now() });
              }}
            >
              <Ionicons name="refresh-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="AdminJournalActivite"
        component={AdminJournalActiviteScreen}
        options={({ route }) => ({
          title: `Journal - ${route.params?.collecteurNom || 'Collecteur'}`,
          headerBackTitle: 'Supervision',
        })}
      />

      {/* ============================= */}
      {/* ÉCRANS AVEC HEADER PERSONNALISÉ - MASQUER HEADER NATIF */}
      {/* ============================= */}

      <Stack.Screen
        name="CollecteurManagementScreen"
        component={CollecteurManagementScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      <Stack.Screen
        name="CollecteurDetailScreen"
        component={CollecteurDetailScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      <Stack.Screen
        name="CollecteurCreationScreen"
        component={CollecteurCreationScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      <Stack.Screen
        name="CollecteurClientsScreen"
        component={CollecteurClientsScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      <Stack.Screen
        name="ClientManagementScreen"
        component={ClientManagementScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      <Stack.Screen
        name="ClientDetailScreen"
        component={ClientDetailScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      <Stack.Screen
        name="JournalClotureScreen"
        component={JournalClotureScreen}
        options={{
          headerShown: false, // MASQUER HEADER NATIF
        }}
      />

      {/* ============================= */}
      {/* ÉCRANS AVEC HEADER NATIF */}
      {/* ============================= */}

      <Stack.Screen
        name="ReportsScreen"
        component={ReportsScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CommissionCalculationScreen"
        component={CommissionCalculationScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CommissionParametersScreen"
        component={CommissionParametersScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CommissionReportScreen"
        component={CommissionReportScreen}
        options={({ route }) => ({
          title: 'Rapport Commission',
        })}
      />

      <Stack.Screen
        name="TransactionDetailScreen"
        component={TransactionDetailScreen}
        options={({ route }) => ({
          title: 'Détails Transaction',
        })}
      />

      <Stack.Screen
        name="TransfertCompteScreen"
        component={TransfertCompteScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;