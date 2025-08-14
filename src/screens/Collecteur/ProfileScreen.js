// src/screens/Collecteur/ProfileScreen.js
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
  RefreshControl,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Utilise le thème de ton projet
const theme = {
  colors: {
    primary: '#007AFF',
    background: '#F5F5F5',
    white: '#FFFFFF',
    text: '#333333',
    textLight: '#666666',
    error: '#FF3B30',
    success: '#34C759',
    lightGray: '#E5E5E7',
  }
};

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      // Pour le web, utiliser un modal personnalisé
      setShowLogoutModal(true);
    } else {
      // Pour mobile, utiliser Alert.alert
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
            onPress: confirmLogout,
          },
        ]
      );
    }
  };

  const confirmLogout = async () => {
    try {
      setLoading(true);
      setShowLogoutModal(false);
      await logout();
      // La navigation sera gérée automatiquement par AuthContext
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: Impossible de se déconnecter');
      } else {
        Alert.alert('Erreur', 'Impossible de se déconnecter');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Ici tu peux recharger les données utilisateur si nécessaire
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Non définie';
    try {
      return format(new Date(date), 'd MMMM yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'COLLECTEUR': return 'Collecteur';
      case 'ADMIN': return 'Administrateur';
      case 'SUPER_ADMIN': return 'Super Administrateur';
      default: return role || 'Utilisateur';
    }
  };

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
        {/* En-tête de profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.prenom?.charAt(0) || ''}
              {user?.nom?.charAt(0) || ''}
            </Text>
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

        {/* Section d'informations */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.adresseMail || user?.email || '-'}</Text>
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
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>

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

        {/* Bouton de déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={styles.logoutButtonText}>
            {loading ? 'Déconnexion...' : 'Déconnexion'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de confirmation pour le web */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmation</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={cancelLogout}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmButtonText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
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
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
    ),
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
  actionsSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
    ),
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
  // Styles du modal de confirmation
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }
    ),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: theme.colors.lightGray,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.error,
  },
  modalCancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
