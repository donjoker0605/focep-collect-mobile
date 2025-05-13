// src/screens/Comon/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Components
import {
  Header,
  Card,
  Button,
  Input,
  EmptyState
} from '../../components';

// Hooks, API et Utils
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile, getUserProfile } from '../../api/auth';
import theme from '../../theme';

// Composant RoleSwitcher pour le mode développement
const RoleSwitcher = ({ user, onSwitchRole }) => {
  if (!__DEV__) return null;
  
  return (
    <Card style={styles.devCard}>
      <Text style={styles.devCardTitle}>Mode développement</Text>
      <Text style={styles.devCardSubtitle}>Changer de rôle pour tester l'application</Text>
      
      <View style={styles.roleButtonsContainer}>
        <TouchableOpacity 
          style={[
            styles.roleButton, 
            user?.role === 'COLLECTEUR' && styles.roleButtonActive
          ]}
          onPress={() => onSwitchRole('COLLECTEUR')}
        >
          <Ionicons 
            name="person-outline" 
            size={18} 
            color={user?.role === 'COLLECTEUR' ? theme.colors.white : theme.colors.primary} 
          />
          <Text style={[
            styles.roleButtonText,
            user?.role === 'COLLECTEUR' && styles.roleButtonTextActive
          ]}>Collecteur</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.roleButton, 
            user?.role === 'ADMIN' && styles.roleButtonActive
          ]}
          onPress={() => onSwitchRole('ADMIN')}
        >
          <Ionicons 
            name="business-outline" 
            size={18} 
            color={user?.role === 'ADMIN' ? theme.colors.white : theme.colors.primary} 
          />
          <Text style={[
            styles.roleButtonText,
            user?.role === 'ADMIN' && styles.roleButtonTextActive
          ]}>Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.roleButton, 
            user?.role === 'SUPER_ADMIN' && styles.roleButtonActive
          ]}
          onPress={() => onSwitchRole('SUPER_ADMIN')}
        >
          <Ionicons 
            name="shield-outline" 
            size={18} 
            color={user?.role === 'SUPER_ADMIN' ? theme.colors.white : theme.colors.primary} 
          />
          <Text style={[
            styles.roleButtonText,
            user?.role === 'SUPER_ADMIN' && styles.roleButtonTextActive
          ]}>Super Admin</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

// Fonction utilitaire pour les haptics qui vérifie la plateforme
const triggerHaptic = (type) => {
  if (Platform.OS !== 'web') {
    // Uniquement exécuter sur les appareils natifs, pas sur le web
    if (type === 'impact') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }
};

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserInfo, switchRole } = useAuth();
  
  // États
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Formulaire
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [adresse, setAdresse] = useState(user?.adresse || '');
  const [email, setEmail] = useState(user?.adresseMail || '');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Charger le profil complet
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user]);
  
  // Charger le profil de l'utilisateur
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // En mode développement, on peut simplement utiliser les données de l'utilisateur
      if (__DEV__) {
        setProfile(user);
        setTelephone(user.telephone || '');
        setAdresse(user.adresse || '');
        setEmail(user.adresseMail || '');
        setLoading(false);
        return;
      }
      
      const response = await getUserProfile(user.id);
      setProfile(response);
      
      // Mettre à jour les champs du formulaire
      setTelephone(response.telephone || '');
      setAdresse(response.adresse || '');
      setEmail(response.adresseMail || '');
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer le mode d'édition
  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    // Si on quitte le mode édition, réinitialiser les champs
    if (editMode) {
      setTelephone(profile.telephone || '');
      setAdresse(profile.adresse || '');
      setEmail(profile.adresseMail || '');
    }
    
    // Vibration de feedback sécurisée
    triggerHaptic('impact');
  };
  
  // Sauvegarder les modifications du profil
  const handleSaveProfile = async () => {
    try {
      setUpdating(true);
      setError(null);
      
      // Données à mettre à jour
      const updatedData = {
        id: profile.id,
        telephone,
        adresse,
        adresseMail: email
      };
      
      // Appel API
      const updatedProfile = await updateUserProfile(updatedData);
      
      // Mettre à jour le contexte d'authentification
      updateUserInfo(updatedProfile);
      
      // Mettre à jour l'état local
      setProfile(updatedProfile);
      
      // Quitter le mode édition
      setEditMode(false);
      
      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'Vos informations ont été mises à jour avec succès.',
        [{ text: 'OK' }]
      );
      
      // Vibration de succès sécurisée
      triggerHaptic('success');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(err.message || 'Erreur lors de la mise à jour du profil');
      
      // Vibration d'erreur sécurisée
      triggerHaptic('error');
    } finally {
      setUpdating(false);
    }
  };
  
  // Changement de rôle (mode développement)
  const handleSwitchRole = async (newRole) => {
    try {
      if (switchRole) {
        await switchRole(newRole);
        // Le profil sera rechargé automatiquement grâce à l'effet useEffect
        
        // Feedback haptique
        triggerHaptic('success');
        
        // Message de confirmation
        Alert.alert(
          'Changement de rôle',
          `Vous êtes maintenant connecté en tant que ${newRole === 'ADMIN' ? 'Administrateur' : 
            newRole === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Collecteur'}.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Erreur lors du changement de rôle:', err);
      setError(err.message || 'Erreur lors du changement de rôle');
      triggerHaptic('error');
    }
  };
  
  // Déconnexion
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Déconnexion',
          onPress: async () => {
            await logout();
            // La redirection sera gérée par le système de navigation en fonction
            // de l'état d'authentification
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Changer le mot de passe
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };
  
  // Obtenir les initiales pour l'avatar
  const getInitials = () => {
    if (!profile) return '?';
    return `${profile.prenom?.charAt(0) || ''}${profile.nom?.charAt(0) || ''}`.toUpperCase();
  };
  
  // Si en cours de chargement
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Mon Profil"
          showBackButton={false}
        />
        <View style={[styles.content, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </View>
    );
  }
  
  // Si erreur
  if (error && !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Mon Profil"
          showBackButton={false}
        />
        <View style={styles.content}>
          <EmptyState
            type="error"
            title="Erreur"
            message={error}
            actionButton={true}
            actionButtonTitle="Réessayer"
            onActionButtonPress={loadProfile}
          />
        </View>
      </View>
    );
  }
  
  // Rendu principal
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Mon Profil"
        showBackButton={false}
        rightComponent={
          <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
            <Ionicons 
              name={editMode ? "close-outline" : "create-outline"} 
              size={24} 
              color={theme.colors.white} 
            />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Avatar et nom */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>
              {profile?.prenom} {profile?.nom}
            </Text>
            <Text style={styles.roleText}>
              {profile?.role === 'ADMIN' ? 'Administrateur' : 
                profile?.role === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Collecteur'}
            </Text>
          </View>
        </View>
        
        {/* Message d'erreur */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Sélecteur de rôles (mode développement uniquement) */}
        {__DEV__ && <RoleSwitcher user={profile} onSwitchRole={handleSwitchRole} />}
        
        {/* Informations personnelles */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>
          
          <Input
            label="Téléphone"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
            disabled={!editMode || updating}
            icon="call-outline"
          />
          
          <Input
            label="Adresse"
            value={adresse}
            onChangeText={setAdresse}
            disabled={!editMode || updating}
            icon="location-outline"
          />
          
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            disabled={!editMode || updating}
            icon="mail-outline"
          />
          
          {editMode && (
            <Button
              title="Enregistrer les modifications"
              onPress={handleSaveProfile}
              loading={updating}
              disabled={updating}
              style={styles.saveButton}
            />
          )}
        </Card>
        
        {/* Informations professionnelles */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informations professionnelles</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Matricule</Text>
            <Text style={styles.infoValue}>{profile?.matricule || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CNI</Text>
            <Text style={styles.infoValue}>{profile?.numeroCni || 'N/A'}</Text>
          </View>
          
          {profile?.role === 'COLLECTEUR' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agence</Text>
              <Text style={styles.infoValue}>{profile?.agence?.nom || 'N/A'}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d'inscription</Text>
            <Text style={styles.infoValue}>
              {profile?.dateCreation ? new Date(profile.dateCreation).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </Card>
        
        {/* Paramètres */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Paramètres</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Authentification biométrique</Text>
              <Text style={styles.settingDescription}>
                Utiliser votre empreinte digitale pour vous connecter
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: theme.colors.lightGray, true: `${theme.colors.primary}80` }}
              thumbColor={biometricsEnabled ? theme.colors.primary : theme.colors.gray}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Mode nuit</Text>
              <Text style={styles.settingDescription}>
                Activer le thème sombre
              </Text>
            </View>
            <Switch
              value={nightMode}
              onValueChange={setNightMode}
              trackColor={{ false: theme.colors.lightGray, true: `${theme.colors.primary}80` }}
              thumbColor={nightMode ? theme.colors.primary : theme.colors.gray}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Recevoir des notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.lightGray, true: `${theme.colors.primary}80` }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.gray}
            />
          </View>
        </Card>
        
        {/* Sécurité */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Sécurité</Text>
          
          <TouchableOpacity
            style={styles.securityOption}
            onPress={handleChangePassword}
          >
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text} />
            <Text style={styles.securityOptionText}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
          </TouchableOpacity>
        </Card>
        
        {/* Déconnexion */}
        <Button
          title="Déconnexion"
          onPress={handleLogout}
          variant="outlined"
          style={styles.logoutButton}
          textStyle={{ color: theme.colors.error }}
        />
        
        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  editButton: {
    padding: 8,
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  nameContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  
  // Dev mode styles
  devCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  devCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  devCardSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  roleButtonTextActive: {
    color: theme.colors.white,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  
  // Cards
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
  },
  
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  
  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  
  // Security
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  securityOptionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  
  // Logout
  logoutButton: {
    marginVertical: 16,
    borderColor: theme.colors.error,
  },
  versionText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginBottom: 20,
  },
});

export default ProfileScreen;
