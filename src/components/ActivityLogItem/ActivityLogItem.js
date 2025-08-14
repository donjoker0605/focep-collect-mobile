// src/components/ActivityLogItem/ActivityLogItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';
import { formatTimeAgo } from '../../utils/formatters';

const ActivityLogItem = ({ activity, isAdmin = false, onPress }) => {
  // Déterminer l'icône selon le type d'action
  const getActionIcon = (action) => {
    const icons = {
      'CREATE_CLIENT': 'person-add',
      'MODIFY_CLIENT': 'create',
      'DELETE_CLIENT': 'person-remove',
      'TRANSACTION_EPARGNE': 'arrow-up-circle',
      'TRANSACTION_RETRAIT': 'arrow-down-circle',
      'LOGIN': 'log-in',
      'LOGOUT': 'log-out',
      'JOURNAL_CREATE': 'document-text',
      'JOURNAL_CLOSE': 'checkmark-circle',
      'COMMISSION_CALCULATE': 'calculator',
      'SYNC': 'sync',
      'SYSTEM': 'settings',
      'ERROR': 'alert-circle',
      'WARNING': 'warning',
      'INFO': 'information-circle'
    };
    return icons[action] || 'document';
  };

  // Déterminer la couleur selon le type d'action
  const getActionColor = (action) => {
    const colors = {
      'CREATE_CLIENT': theme.colors.success,
      'MODIFY_CLIENT': theme.colors.warning,
      'DELETE_CLIENT': theme.colors.error,
      'TRANSACTION_EPARGNE': theme.colors.success,
      'TRANSACTION_RETRAIT': theme.colors.warning,
      'LOGIN': theme.colors.primary,
      'LOGOUT': theme.colors.textSecondary,
      'JOURNAL_CREATE': theme.colors.info,
      'JOURNAL_CLOSE': theme.colors.success,
      'COMMISSION_CALCULATE': theme.colors.secondary,
      'SYNC': theme.colors.info,
      'SYSTEM': theme.colors.textSecondary,
      'ERROR': theme.colors.error,
      'WARNING': theme.colors.warning,
      'INFO': theme.colors.info
    };
    return colors[action] || theme.colors.textSecondary;
  };

  // Obtenir le libellé de l'action
  const getActionDisplayName = (action) => {
    const names = {
      'CREATE_CLIENT': 'Client créé',
      'MODIFY_CLIENT': 'Client modifié',
      'DELETE_CLIENT': 'Client supprimé',
      'TRANSACTION_EPARGNE': 'Épargne',
      'TRANSACTION_RETRAIT': 'Retrait',
      'LOGIN': 'Connexion',
      'LOGOUT': 'Déconnexion',
      'JOURNAL_CREATE': 'Journal créé',
      'JOURNAL_CLOSE': 'Journal clôturé',
      'COMMISSION_CALCULATE': 'Commission calculée',
      'SYNC': 'Synchronisation',
      'SYSTEM': 'Système',
      'ERROR': 'Erreur',
      'WARNING': 'Avertissement',
      'INFO': 'Information'
    };
    return names[action] || action;
  };

  // Parser les détails JSON si disponibles
  const parseDetails = (details) => {
    if (!details) return null;
    
    try {
      return typeof details === 'string' ? JSON.parse(details) : details;
    } catch (error) {
      return details;
    }
  };

  const actionIcon = getActionIcon(activity.action);
  const actionColor = getActionColor(activity.action);
  const actionName = getActionDisplayName(activity.action);
  const parsedDetails = parseDetails(activity.details);
  const timestamp = new Date(activity.timestamp);

  const component = (
    <View style={styles.container}>
      {/* Header de l'activité */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: `${actionColor}20` }]}>
            <Ionicons name={actionIcon} size={20} color={actionColor} />
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.actionTitle}>{actionName}</Text>
            <Text style={styles.timestamp}>
              {formatTimeAgo(timestamp)}
            </Text>
          </View>
          
          {/* Message ou description */}
          {activity.message && (
            <Text style={styles.message}>{activity.message}</Text>
          )}
          
          {/* Détails de l'entité concernée */}
          {activity.entityType && activity.entityId && (
            <Text style={styles.entityInfo}>
              {activity.entityType} #{activity.entityId}
            </Text>
          )}
          
          {/* Détails JSON parsés */}
          {parsedDetails && (
            <View style={styles.detailsContainer}>
              {typeof parsedDetails === 'object' ? (
                Object.entries(parsedDetails).map(([key, value]) => (
                  <Text key={key} style={styles.detailItem}>
                    {key}: {String(value)}
                  </Text>
                ))
              ) : (
                <Text style={styles.detailItem}>{String(parsedDetails)}</Text>
              )}
            </View>
          )}
          
          {/* Informations admin (visible seulement en mode admin) */}
          {isAdmin && (
            <View style={styles.adminInfo}>
              {activity.ipAddress && (
                <Text style={styles.adminDetail}>IP: {activity.ipAddress}</Text>
              )}
              {activity.userAgent && (
                <Text style={styles.adminDetail} numberOfLines={1}>
                  UA: {activity.userAgent}
                </Text>
              )}
              <Text style={styles.adminDetail}>
                {format(timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(activity)} activeOpacity={0.7}>
        {component}
      </TouchableOpacity>
    );
  }

  return component;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
      : {
          elevation: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        }
    ),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  message: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  entityInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xs,
  },
  detailsContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  detailItem: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  adminInfo: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  adminDetail: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
});

export default ActivityLogItem;