// src/navigation/AdminStack.js - VERSION MISE À JOUR AVEC GESTION CLIENTS AMÉLIORÉE
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

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

// 🔥 ÉCRANS DE GESTION DES CLIENTS - NOUVEAUX ET AMÉLIORÉS
import ClientManagementScreen from '../screens/Admin/ClientManagementScreen'; // Ancien écran (compatible)
import AdminClientManagementScreen from '../screens/Admin/AdminClientManagementScreen'; // 🆕 NOUVEL ÉCRAN PRINCIPAL
import ClientDetailScreen from '../screens/Admin/ClientDetailScreen';

// Import du ClientListScreen du collecteur (réutilisé pour admin)
import ClientListScreen from '../screens/Collecteur/ClientListScreen'; // 🔄 RÉUTILISÉ AVEC COMPATIBILITÉ

// Import des écrans de création/édition client
import ClientAddEditScreen from '../screens/Collecteur/ClientAddEditScreen'; // 🔄 RÉUTILISÉ

// Écrans de rapports et commissions
import ReportsScreen from '../screens/Admin/ReportsScreen';
import CommissionCalculationV2Screen from '../screens/Admin/CommissionCalculationV2Screen';
import CommissionReportScreen from '../screens/Admin/CommissionReportScreen';
import RubriqueRemunerationScreen from '../screens/Admin/RubriqueRemunerationScreen';
import CommissionProcessusCompletScreen from '../screens/Admin/CommissionProcessusCompletScreen';
import CommissionResultsScreen from '../screens/Admin/CommissionResultsScreen';
import RemunerationProcessScreen from '../screens/Admin/RemunerationProcessScreen';

// Écrans de transactions et transferts
import TransactionDetailScreen from '../screens/Admin/TransactionDetailScreen';
import TransfertCompteScreen from '../screens/Admin/TransfertCompteScreen';
import JournalClotureScreen from '../screens/Admin/JournalClotureScreen';

const Stack = createNativeStackNavigator();

const AdminStack = () => {
  const { logout } = useAuth();
  
  // 🔥 FONCTION DE DÉCONNEXION AMÉLIORÉE
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
              console.log('🔄 Déconnexion admin en cours...');
              
              // Appel de la fonction logout avec gestion d'erreur
              const result = await logout();
              
              if (result && !result.success) {
                console.warn('⚠️ Déconnexion partiellement échouée:', result.error);
                // Même en cas d'erreur serveur, la déconnexion locale a été effectuée
                console.log('✅ Déconnexion locale réussie malgré l\'erreur serveur');
              } else {
                console.log('✅ Déconnexion complètement réussie');
              }
              
              // Ne pas afficher d'erreur si la déconnexion locale a fonctionné
              
            } catch (error) {
              console.error('❌ Erreur critique lors de la déconnexion:', error);
              
              // Même en cas d'erreur, tenter de forcer la déconnexion locale
              Alert.alert(
                'Déconnexion',
                'Déconnexion effectuée localement. L\'application va se recharger.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Forcer le rafraîchissement de l'app
                      if (typeof window !== 'undefined' && window.location) {
                        window.location.reload();
                      }
                    }
                  }
                ]
              );
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
        options={{
          headerShown: false, // Masquer le header de navigation pour utiliser celui de l'écran
        }}
      />

      <Stack.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity onPress={() => {}} style={{ marginRight: 15 }}>
              <Ionicons name="refresh-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="AdminCollecteurSupervision"
        component={AdminCollecteurSupervisionScreen}
        options={{
          title: 'Supervision Collecteurs',
          headerRight: () => (
            <TouchableOpacity onPress={() => {}} style={{ marginRight: 15 }}>
              <Ionicons name="refresh-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
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
      {/* 🔥 ÉCRANS DE GESTION DES CLIENTS - NOUVEAUX */}
      {/* ============================= */}

      {/* 🆕 NOUVEL ÉCRAN PRINCIPAL DE GESTION CLIENTS ADMIN */}
      <Stack.Screen
        name="AdminClientManagement"
        component={AdminClientManagementScreen}
        options={{
          headerShown: false, // Utilise son propre header
        }}
      />

      {/* 🔄 ÉCRAN DE LISTE CLIENTS RÉUTILISÉ (collecteur compatible admin) */}
      <Stack.Screen
        name="ClientList"
        component={ClientListScreen}
        options={{
          headerShown: false, // Utilise son propre header
        }}
      />

      {/* 🔄 ÉCRANS D'AJOUT/ÉDITION RÉUTILISÉS */}
      <Stack.Screen
        name="ClientAddEdit"
        component={ClientAddEditScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'edit' ? 'Modifier Client' : 'Nouveau Client',
          headerBackTitle: 'Clients',
        })}
      />

      {/* ============================= */}
      {/* ÉCRANS AVEC HEADER PERSONNALISÉ */}
      {/* ============================= */}

      <Stack.Screen
        name="CollecteurManagementScreen"
        component={CollecteurManagementScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CollecteurDetailScreen"
        component={CollecteurDetailScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CollecteurCreationScreen"
        component={CollecteurCreationScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CollecteurClientsScreen"
        component={CollecteurClientsScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* 🔄 ANCIEN ÉCRAN CLIENT MANAGEMENT (pour compatibilité) */}
      <Stack.Screen
        name="ClientManagementScreen"
        component={ClientManagementScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ClientDetailScreen"
        component={ClientDetailScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="JournalClotureScreen"
        component={JournalClotureScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ReportsScreen"
        component={ReportsScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CommissionCalculationV2Screen"
        component={CommissionCalculationV2Screen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CommissionProcessusCompletScreen"
        component={CommissionProcessusCompletScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="RubriqueRemunerationScreen"
        component={RubriqueRemunerationScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CommissionResultsScreen"
        component={CommissionResultsScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="RemunerationProcessScreen"
        component={RemunerationProcessScreen}
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