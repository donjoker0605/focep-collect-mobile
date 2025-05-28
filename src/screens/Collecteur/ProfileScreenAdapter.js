// src/screens/Collecteur/ProfileScreenAdapter.js - VERSION CORRIGÉE FINALE
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';

// ✅ IMPORTS CORRIGÉS POUR LES SERVICES
import { authService } from '../../services/authService';
import { collecteurService } from '../../services/collecteurService';

export default function ProfileScreenAdapter() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // ✅ ÉTATS POUR GÉRER LES DONNÉES UTILISATEUR COMPLÈTES
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CHARGEMENT INITIAL DES DONNÉES UTILISATEUR
  useEffect(() => {
    loadUserProfile();
  }, []);

  // ✅ FONCTION POUR CHARGER LE PROFIL COMPLET DE L'UTILISATEUR
  const loadUserProfile = async () => {
    try {
      setError(null);
      console.log('👤 Chargement du profil utilisateur:', user);
      
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }

      // 1. D'abord utiliser les données en cache
      setUserProfile(user);
      
      // 2. Ensuite essayer de récupérer les données fraîches
      try {
        let freshUserData = null;
        
        if (user.role === 'COLLECTEUR') {
          // Pour un collecteur, récupérer les détails via collecteurService
          const response = await collecteurService.getCollecteurById(user.id);
          if (response.success) {
            freshUserData = response.data;
          }
        } else {
          // Pour les autres rôles, utiliser getCurrentUser
          freshUserData = await authService.getCurrentUser();
        }
        
        if (freshUserData) {
          console.log('✅ Données utilisateur fraîches récupérées:', freshUserData);
          setUserProfile(freshUserData);
        }
      } catch (apiError) {
        console.warn('⚠️ Erreur API, utilisation des données en cache:', apiError.message);
        // Continuer avec les données en cache
      }
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement du profil:', err);
      setError(err.message);
      // En cas d'erreur, utiliser les données de base si disponibles
      if (user) {
        setUserProfile(user);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION DE RAFRAÎCHISSEMENT
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  // ✅ FONCTION DE DÉCONNEXION AMÉLIORÉE
  const handleLogout = async () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
              router.replace('/auth');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ FONCTION POUR FORMATER LA DATE D'INSCRIPTION
  const formatJoinDate = (date) => {
    if (!date) return 'Non définie';
    try {
      return format(new Date(date), 'd MMMM yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // ✅ FONCTION POUR OBTENIR LE TEXTE DU RÔLE
  const getRoleText = (role) => {
    switch (role) {
      case 'COLLECTEUR': return 'Collecteur';
      case 'ADMIN': return 'Administrateur';
      case 'SUPER_ADMIN': return 'Super Administrateur';
      default: return role || 'Utilisateur';
    }
  };

  // ✅ COMPOSANTS UI
  const ProfileHeader = ({ user }) => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {user?.prenom?.charAt(0) || ''}
          {user?.nom?.charAt(0) || ''}
        </Text>
        {user?.active !== undefined && (
          <View style={[
            styles.statusIndicator,
            user.active ? styles.activeIndicator : styles.inactiveIndicator
          ]} />
        )}
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>
          {user?.prenom} {user?.nom}
        </Text>
        <Text style={styles.userRole}>
          {getRoleText(user?.role)}
        </Text>
        {user?.agence?.nom && (
          <Text style={styles.userAgence}>
            📍 {user.agence.nom}
          </Text>
        )}
      </View>
    </View>
  );

  const InfoSection = ({ user }) => (
    <View style={styles.infoSection}>
      <View style={styles.infoItem}>
        <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{user?.adresseMail || '-'}</Text>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.infoLabel}>Téléphone:</Text>
        <Text style={styles.infoValue}>{user?.telephone || '-'}</Text>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="id-card-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.infoLabel}>CNI:</Text>
        <Text style={styles.infoValue}>{user?.numeroCni || '-'}</Text>
      </View>

      {user?.dateCreation && (
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.infoLabel}>Inscription:</Text>
          <Text style={styles.infoValue}>{formatJoinDate(user.dateCreation)}</Text>
        </View>
      )}

      {user?.role === 'COLLECTEUR' && user?.montantMaxRetrait && (
        <View style={styles.infoItem}>
          <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.infoLabel}>Montant max:</Text>
          <Text style={styles.infoValue}>
            {user.montantMaxRetrait.toLocaleString()} FCFA
          </Text>
        </View>
      )}
    </View>
  );

  const StatsSection = ({ user }) => {
    if (user?.role !== 'COLLECTEUR') return null;
    
    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalClients || 0}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.ancienneteEnMois || 0}</Text>
            <Text style={styles.statLabel}>Mois d'expérience</Text>
          </View>
        </View>
      </View>
    );
  };

  // ✅ GESTION DES ÉTATS DE CHARGEMENT
  if (loading && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ RENDU PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={theme.colors.white} 
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ✅ EN-TÊTE DE PROFIL */}
        <ProfileHeader user={userProfile} />

        {/* ✅ SECTION D'INFORMATIONS */}
        <InfoSection user={userProfile} />

        {/* ✅ SECTION STATISTIQUES (pour les collecteurs) */}
        <StatsSection user={userProfile} />

        {/* ✅ ACTIONS */}
        <View style={styles.actionsSection}>
          {userProfile?.role === 'COLLECTEUR' && (
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Paramètres</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Aide & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>À propos</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* ✅ BOUTON DE DÉCONNEXION */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={styles.logoutButtonText}>
            {loading ? 'Déconnexion...' : 'Déconnexion'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  activeIndicator: {
    backgroundColor: theme.colors.success,
  },
  inactiveIndicator: {
    backgroundColor: theme.colors.error,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  userAgence: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    ...theme.shadows?.small,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginLeft: 10,
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'right',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    ...theme.shadows?.small,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    ...theme.shadows?.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});