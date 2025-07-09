// src/navigation/AdminStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Écrans existants (à adapter selon votre structure)
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CollecteurManagementScreen from '../screens/Admin/CollecteurManagementScreen';
import AdminNotificationsScreen from '../screens/Admin/AdminNotificationsScreen';
import AdminReportsScreen from '../screens/Admin/AdminReportsScreen';

// 🎯 Nouveaux écrans de supervision des collecteurs
import AdminCollecteurSupervisionScreen from '../screens/Admin/AdminCollecteurSupervisionScreen';
import AdminCollecteurDetailScreen from '../screens/Admin/AdminCollecteurDetailScreen';
import AdminCollecteurCriticalScreen from '../screens/Admin/AdminCollecteurCriticalScreen';
import AdminCollecteurActivitiesScreen from '../screens/Admin/AdminCollecteurActivitiesScreen';

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
      {/* ÉCRANS PRINCIPAUX EXISTANTS */}
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
        name="AdminCollecteurs"
        component={AdminCollecteursScreen}
        options={{
          title: 'Gestion Collecteurs',
        }}
      />

      <Stack.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />

      <Stack.Screen
        name="AdminReports"
        component={AdminReportsScreen}
        options={{
          title: 'Rapports',
        }}
      />

      {/* ============================= */}
      {/* 🎯 NOUVEAUX ÉCRANS SUPERVISION */}
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
                // Action pour actualiser ou filtrer
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
          // Le headerRight est géré dans le composant lui-même
        })}
      />

      <Stack.Screen
        name="AdminCollecteurCritical"
        component={AdminCollecteurCriticalScreen}
        options={({ route }) => ({
          title: 'Activités Critiques',
          headerBackTitle: 'Détails',
          // Le headerRight est géré dans le composant lui-même
        })}
      />

      <Stack.Screen
        name="AdminCollecteurActivities"
        component={AdminCollecteurActivitiesScreen}
        options={({ route }) => ({
          title: 'Toutes les activités',
          headerBackTitle: 'Détails',
          // Le headerRight est géré dans le composant lui-même
        })}
      />

      {/* ============================= */}
      {/* ÉCRANS MODAUX (si nécessaire) */}
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
 * À utiliser depuis d'autres écrans pour naviguer vers la supervision
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
 * Utilisable dans les composants pour les actions rapides
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