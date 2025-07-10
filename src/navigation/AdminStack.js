// src/navigation/AdminStack.js - VERSION CORRIGÉE COMPLÈTE
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================= 
// IMPORTS DES ÉCRANS EXISTANTS
// ============================= 

// Écrans principaux
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminNotificationsScreen from '../screens/Admin/AdminNotificationsScreen';

// Écrans de gestion des collecteurs
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import CollecteurDetailScreen from '../screens/Admin/CollecteurDetailScreen';
import CollecteurCreationScreen from '../screens/Admin/CollecteurCreationScreen';
import CollecteurClientsScreen from '../screens/Admin/CollecteurClientsScreen';

// Écrans de supervision des collecteurs
import AdminCollecteurSupervisionScreen from '../screens/Admin/AdminCollecteurSupervisionScreen';
import AdminCollecteurDetailScreen from '../screens/Admin/AdminCollecteurDetailScreen';
import AdminCollecteurCriticalScreen from '../screens/Admin/AdminCollecteurCriticalScreen';
import AdminCollecteurActivitiesScreen from '../screens/Admin/AdminCollecteurActivitiesScreen';

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
              style={{ marginRight: 16, padding: 8 }}
              onPress={() => navigation.navigate('AdminNotifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
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
          title: route.params?.mode === 'edit' ? 'Modifier Collecteur' : 'Nouveau Collecteur',
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
        name="AdminCollecteurDetail"
        component={AdminCollecteurDetailScreen}
        options={({ route }) => ({
          title: route.params?.collecteurNom || 'Détails Collecteur',
          headerBackTitle: 'Supervision',
        })}
      />

      <Stack.Screen
        name="AdminCollecteurCritical"
        component={AdminCollecteurCriticalScreen}
        options={({ route }) => ({
          title: 'Activités Critiques',
          headerBackTitle: 'Détails',
        })}
      />

      <Stack.Screen
        name="AdminCollecteurActivities"
        component={AdminCollecteurActivitiesScreen}
        options={({ route }) => ({
          title: 'Toutes les activités',
          headerBackTitle: 'Détails',
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
      {/* RAPPORTS ET ANALYSES */}
      {/* ============================= */}

      <Stack.Screen
        name="ReportsScreen"
        component={ReportsScreen}
        options={{
          title: 'Rapports',
        }}
      />

      {/* ============================= */}
      {/* COMMISSIONS */}
      {/* ============================= */}

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
          title: 'Paramètres de Commission',
        }}
      />

      <Stack.Screen
        name="CommissionReportScreen"
        component={CommissionReportScreen}
        options={({ route }) => ({
          title: `Commissions - ${route.params?.collecteurName || 'Rapport'}`,
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
          title: 'Journal & Clôture',
        }}
      />

      {/* ============================= */}
      {/* ÉCRANS MODAUX */}
      {/* ============================= */}

      <Stack.Screen
        name="AdminCollecteurMessage"
        component={AdminCollecteurMessageModal}
        options={{
          title: 'Envoyer un message',
          presentation: 'modal',
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="AdminCollecteurStats"
        component={AdminCollecteurStatsModal}
        options={{
          title: 'Statistiques détaillées',
          presentation: 'modal',
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * 📨 Écran modal pour envoyer un message à un collecteur
 * (À implémenter selon vos besoins)
 */
const AdminCollecteurMessageModal = ({ route, navigation }) => {
  // TODO: Implémenter l'écran de message
  return null;
};

/**
 * 📊 Écran modal pour les statistiques détaillées
 * (À implémenter selon vos besoins)
 */
const AdminCollecteurStatsModal = ({ route, navigation }) => {
  // TODO: Implémenter l'écran de stats
  return null;
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
    navigation.navigate('AdminCollecteurDetail', {
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

  const goToCollecteurDetail = (collecteurId, collecteurNom, agenceNom) => {
    navigation.navigate('AdminCollecteurDetail', {
      collecteurId,
      collecteurNom,
      agenceNom,
    });
  };

  const goToCriticalActivities = (collecteurId, collecteurNom, critiques = []) => {
    navigation.navigate('AdminCollecteurCritical', {
      collecteurId,
      collecteurNom,
      critiques,
    });
  };

  const goToAllActivities = (collecteurId, collecteurNom) => {
    navigation.navigate('AdminCollecteurActivities', {
      collecteurId,
      collecteurNom,
    });
  };

  return {
    goToSupervision,
    goToCollecteurDetail,
    goToCriticalActivities,
    goToAllActivities,
  };
};

/**
 * 🎨 Composants de boutons d'action réutilisables
 */
export const SupervisionHeaderButton = ({ onPress, iconName, color = '#007AFF' }) => (
  <TouchableOpacity
    style={{ marginRight: 16, padding: 8 }}
    onPress={onPress}
  >
    <Ionicons name={iconName} size={24} color={color} />
  </TouchableOpacity>
);

/**
 * 🔄 Gestionnaire de mise à jour automatique pour les écrans de supervision
 */
export const useAutoRefresh = (refreshFunction, intervalMs = 300000) => {
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (refreshFunction && typeof refreshFunction === 'function') {
        refreshFunction(true); // Refresh silencieux
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refreshFunction, intervalMs]);
};

export default AdminStack;