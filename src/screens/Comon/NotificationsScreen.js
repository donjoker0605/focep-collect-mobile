// src/screens/Comon/NotificationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Components
import {
  Header,
  EmptyState
} from '../../components';

// Hooks et Services - CORRECTION CRITIQUE
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services'; // Utiliser le service correct

// Utils et Theme
import theme from '../../theme';
import { formatRelativeTime } from '../../utils/dateUtils';

// Fonction utilitaire pour les haptics qui vérifie la plateforme
const triggerHaptic = (type) => {
  if (Platform.OS !== 'web') {
    if (type === 'impact') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }
};

const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // États
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Charger les notifications - MÉTHODE CORRIGÉE
  const loadNotifications = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // CORRECTION : Utiliser le service correct avec gestion d'erreur
      const response = await notificationService.getNotifications(0, 20);
      
      // Gérer les réponses vides ou les endpoints non disponibles
      if (response.warning) {
        console.warn(response.warning);
        setNotifications([]); // Tableau vide si endpoint non disponible
      } else {
        setNotifications(response.data || []);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError(err.message || 'Erreur lors du chargement des notifications');
      setNotifications([]); // Assurer un tableau vide en cas d'erreur
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);
  
  // Charger les notifications au démarrage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  
  // Rafraîchir les notifications
  const handleRefresh = () => {
    loadNotifications(true);
  };
  
  // Marquer une notification comme lue - MÉTHODE CORRIGÉE
  const handleMarkAsRead = async (notificationId) => {
    try {
      // Mise à jour optimiste
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // CORRECTION : Utiliser le service correct
      await notificationService.markAsRead(notificationId);
      
      // Vibration de feedback sécurisée
      triggerHaptic('impact');
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err);
      // Annuler la mise à jour optimiste en cas d'erreur
      loadNotifications();
    }
  };
  
  // Obtenir l'icône pour un type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TRANSACTION':
        return 'swap-horizontal';
      case 'COMMISSION':
        return 'wallet';
      case 'TRANSFER':
        return 'people';
      case 'SYSTEM':
        return 'settings';
      case 'WARNING':
        return 'warning';
      default:
        return 'notifications';
    }
  };
  
  // Obtenir la couleur pour un type de notification
  const getNotificationColor = (type) => {
    switch (type) {
      case 'TRANSACTION':
        return theme.colors.primary;
      case 'COMMISSION':
        return theme.colors.success;
      case 'TRANSFER':
        return theme.colors.info;
      case 'SYSTEM':
        return theme.colors.gray;
      case 'WARNING':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };
  
  // Naviguer vers le détail d'une notification
  const handleNotificationPress = (notification) => {
    // Marquer comme lue si ce n'est pas déjà fait
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigue vers la page appropriée en fonction du type
    switch (notification.type) {
      case 'TRANSACTION':
        if (notification.data?.transactionId) {
          navigation.navigate('CollecteDetail', { transactionId: notification.data.transactionId });
        }
        break;
      case 'COMMISSION':
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          navigation.navigate('CommissionReport');
        }
        break;
      case 'TRANSFER':
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          if (notification.data?.collecteurId) {
            navigation.navigate('CollecteurDetail', { collecteurId: notification.data.collecteurId });
          } else {
            navigation.navigate('CollecteurManagement');
          }
        }
        break;
      case 'SYSTEM':
        // Généralement pas de navigation pour les notifications système
        break;
      default:
        // Par défaut, ne fait rien
        break;
    }
  };
  
  // Rendu d'un item de notification
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.read ? styles.readNotification : styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: `${getNotificationColor(item.type)}20` }
      ]}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        
        <Text 
          style={[
            styles.notificationMessage,
            item.read && styles.readNotificationText
          ]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        
        {!item.read && (
          <TouchableOpacity
            style={styles.markAsReadButton}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <Text style={styles.markAsReadText}>Marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
  
  // Si en cours de chargement
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Notifications"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      </View>
    );
  }
  
  // Rendu principal
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Notifications"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              // Logique pour marquer toutes les notifications comme lues
              Alert.alert(
                'Confirmation',
                'Marquer toutes les notifications comme lues ?',
                [
                  {
                    text: 'Annuler',
                    style: 'cancel'
                  },
                  {
                    text: 'Confirmer',
                    onPress: async () => {
                      try {
                        // CORRECTION : Utiliser le service correct
                        await Promise.all(
                          notifications
                            .filter(n => !n.read)
                            .map(n => notificationService.markAsRead(n.id))
                        );
                        loadNotifications(true);
                        triggerHaptic('success');
                      } catch (err) {
                        console.error('Erreur:', err);
                        triggerHaptic('error');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="checkmark-done-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {error ? (
          <EmptyState
            type="error"
            title="Erreur"
            message={error}
            actionButton={true}
            actionButtonTitle="Réessayer"
            onActionButtonPress={handleRefresh}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            type="info"
            title="Aucune notification"
            message="Vous n'avez aucune notification pour le moment."
            icon="notifications-off"
          />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.notificationList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  clearButton: {
    padding: 8,
  },
  
  // Liste des notifications
  notificationList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  readNotification: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  readNotificationText: {
    color: theme.colors.textLight,
  },
  markAsReadButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 4,
  },
  markAsReadText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default NotificationsScreen;
export default NotificationsScreen;