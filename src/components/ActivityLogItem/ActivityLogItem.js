// src/components/ActivityLogItem/ActivityLogItem.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';

const ActivityLogItem = ({ activity, onPress }) => {
  const getActionIcon = (actionIcon) => {
    const iconMap = {
      'person-add': 'person-add',
      'create': 'create',
      'trash': 'trash',
      'log-in': 'log-in',
      'log-out': 'log-out',
      'arrow-down-circle': 'arrow-down-circle',
      'arrow-up-circle': 'arrow-up-circle',
      'information-circle': 'information-circle'
    };
    return iconMap[actionIcon] || 'information-circle';
  };

  const getActionColor = (actionColor) => {
    const colorMap = {
      'success': theme.colors.success,
      'warning': theme.colors.warning,
      'danger': theme.colors.error,
      'primary': theme.colors.primary,
      'medium': theme.colors.textLight
    };
    return colorMap[actionColor] || theme.colors.textLight;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm:ss', { locale: fr });
  };

  const getStatusIndicator = () => {
    if (activity.success === false) {
      return (
        <View style={[styles.statusIndicator, styles.statusError]}>
          <Ionicons name="close-circle" size={12} color={theme.colors.white} />
        </View>
      );
    }
    return (
      <View style={[styles.statusIndicator, styles.statusSuccess]}>
        <Ionicons name="checkmark-circle" size={12} color={theme.colors.white} />
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getActionIcon(activity.actionIcon)} 
          size={24} 
          color={getActionColor(activity.actionColor)} 
        />
        {getStatusIndicator()}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.actionName} numberOfLines={1}>
            {activity.actionDisplayName}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(activity.timestamp)}
          </Text>
        </View>

        <View style={styles.details}>
          {activity.entityDisplayName && (
            <Text style={styles.entityName} numberOfLines={1}>
              {activity.entityDisplayName}
            </Text>
          )}
          
          {activity.durationMs && (
            <Text style={styles.duration}>
              {activity.durationMs}ms
            </Text>
          )}
        </View>

        {activity.success === false && activity.errorMessage && (
          <Text style={styles.errorMessage} numberOfLines={2}>
            Erreur: {activity.errorMessage}
          </Text>
        )}
      </View>

      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={theme.colors.textLight} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: theme.colors.success,
  },
  statusError: {
    backgroundColor: theme.colors.error,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityName: {
    fontSize: 14,
    color: theme.colors.textLight,
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  errorMessage: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ActivityLogItem;