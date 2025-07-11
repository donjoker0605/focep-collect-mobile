// src/navigation/AdminStack.js - VERSION CORRIGÉE
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

// ✅ ÉCRANS DE SUPERVISION
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

// 🔥 AJOUT : Hook pour la déconnexion
import { useAuth } from '../hooks/useAuth';

const Stack = createStackNavigator();

const AdminStack = () => {
  
  // 🔥 FONCTION DE DÉCONNEXION
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
              // Utiliser authService pour déconnexion propre
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
                // Trigger refresh par navigation params
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
      {/* GESTION DES COLLECTEURS */}
      {/* ============================= */}

      <Stack.Screen
        name="CollecteurManagementScreen"
        component={CollecteurManagementScreen}
        options={{
          title: 'Gestion Collecteurs',
        }}
      />

      <Stack.Screen
        name="CollecteurDetailScreen"
        component={CollecteurDetailScreen}
        options={({ route }) => ({
          title: route.params?.collecteur?.nom || 'Détails Collecteur',
        })}
      />

      <Stack.Screen
        name="CollecteurCreationScreen"
        component={CollecteurCreationScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'edit' 
            ? 'Modifier Collecteur' 
            : 'Nouveau Collecteur',
        })}
      />

      <Stack.Screen
        name="CollecteurClientsScreen"
        component={CollecteurClientsScreen}
        options={({ route }) => ({
          title: `Clients - ${route.params?.collecteurNom || 'Collecteur'}`,
        })}
      />

      {/* ============================= */}
      {/* GESTION DES CLIENTS */}
      {/* ============================= */}

      <Stack.Screen
        name="ClientManagementScreen"
        component={ClientManagementScreen}
        options={{
          title: 'Gestion Clients',
        }}
      />

      <Stack.Screen
        name="ClientDetailScreen"
        component={ClientDetailScreen}
        options={({ route }) => ({
          title: route.params?.client?.nom || 'Détails Client',
        })}
      />

      {/* ============================= */}
      {/* RAPPORTS ET COMMISSIONS */}
      {/* ============================= */}

      <Stack.Screen
        name="ReportsScreen"
        component={ReportsScreen}
        options={{
          title: 'Rapports',
        }}
      />

      <Stack.Screen
        name="CommissionCalculationScreen"
        component={CommissionCalculationScreen}
        options={{
          title: 'Calcul des Commissions',
        }}
      />

      <Stack.Screen
        name="CommissionParametersScreen"
        component={CommissionParametersScreen}
        options={{
          title: 'Paramètres Commissions',
        }}
      />

      <Stack.Screen
        name="CommissionReportScreen"
        component={CommissionReportScreen}
        options={({ route }) => ({
          title: 'Rapport Commission',
        })}
      />

      {/* ============================= */}
      {/* TRANSACTIONS ET TRANSFERTS */}
      {/* ============================= */}

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
          title: 'Transfert de Comptes',
        }}
      />

      <Stack.Screen
        name="JournalClotureScreen"
        component={JournalClotureScreen}
        options={{
          title: 'Clôture Journal',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * 🎯 Configuration des options de navigation par défaut
 */
export const getAdminScreenOptions = (title, options = {}) => ({
  title,
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
  ...options,
});

/**
 * 🚀 Fonction helper pour naviguer vers la supervision
 */
export const navigateToSupervision = (navigation, collecteurId = null) => {
  if (collecteurId) {
    navigation.navigate('AdminJournalActivite', {
      collecteurId,
    });
  } else {
    navigation.navigate('AdminCollecteurSupervision');
  }
};

/**
 * 📱 Hook personnalisé pour les actions de supervision
 */
export const useSupervisionActions = (navigation) => {
  const goToSupervision = () => {
    navigation.navigate('AdminCollecteurSupervision');
  };

  const goToCollecteurJournal = (collecteurId, collecteurNom, agenceNom) => {
    navigation.navigate('AdminJournalActivite', {
      collecteurId,
      collecteurNom,
      agenceNom,
    });
  };

  return {
    goToSupervision,
    goToCollecteurJournal,
  };
};

export default AdminStack;