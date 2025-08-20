// src/components/ActivityLogItem/ActivityLogItem.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';
import { formatTimeAgo } from '../../utils/formatters';
import activityFormatter from '../../utils/activityFormatter';

const ActivityLogItem = ({ activity, isAdmin = false, onPress }) => {
  const [formattedDetails, setFormattedDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les détails formatés de manière asynchrone
  useEffect(() => {
    const loadFormattedActivity = async () => {
      try {
        const formatted = await activityFormatter.formatActivity(activity);
        setFormattedDetails(formatted);
      } catch (error) {
        console.warn('Erreur formatage activité:', error);
        setFormattedDetails(activityFormatter.getBasicActionName(activity.action));
      } finally {
        setLoading(false);
      }
    };

    loadFormattedActivity();
  }, [activity]);


  const actionIcon = activityFormatter.getActionIcon(activity.action);
  const actionColor = activityFormatter.getActionColor(activity.action, theme);
  const actionName = activityFormatter.getBasicActionName(activity.action);
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
          
          {/* 🔥 NOUVEAU: Détails formatés intelligemment avec nouveau formatteur */}
          {!loading && formattedDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.formattedDetail}>{formattedDetails}</Text>
            </View>
          )}
          
          {loading && (
            <View style={styles.detailsContainer}>
              <Text style={styles.loadingDetail}>Chargement...</Text>
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
  formattedDetail: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  loadingDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
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