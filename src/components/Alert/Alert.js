// src/components/Alert/Alert.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const Alert = ({
  type = 'info', // info, success, warning, error
  title,
  message,
  icon,
  action,
  actionText = 'Action',
  onActionPress,
  dismissible = true,
  onDismiss,
  style,
}) => {
  // Configuration selon le type d'alerte
  const getAlertConfig = () => {
    const configs = {
      info: {
        backgroundColor: `${theme.colors.info}10`,
        borderColor: theme.colors.info,
        textColor: theme.colors.info,
        icon: 'information-circle'
      },
      success: {
        backgroundColor: `${theme.colors.success}10`,
        borderColor: theme.colors.success,
        textColor: theme.colors.success,
        icon: 'checkmark-circle'
      },
      warning: {
        backgroundColor: `${theme.colors.warning}10`,
        borderColor: theme.colors.warning,
        textColor: theme.colors.warning,
        icon: 'warning'
      },
      error: {
        backgroundColor: `${theme.colors.error}10`,
        borderColor: theme.colors.error,
        textColor: theme.colors.error,
        icon: 'alert-circle'
      }
    };
    
    return configs[type] || configs.info;
  };
  
  const config = getAlertConfig();
  const alertIcon = icon || config.icon;
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={alertIcon} size={24} color={config.textColor} />
        </View>
        
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: config.textColor }]}>
              {title}
            </Text>
          )}
          
          {message && (
            <Text style={[styles.message, { color: theme.colors.text }]}>
              {message}
            </Text>
          )}
          
          {action && onActionPress && (
            <TouchableOpacity 
              style={[styles.actionButton, { borderColor: config.textColor }]}
              onPress={onActionPress}
            >
              <Text style={[styles.actionText, { color: config.textColor }]}>
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {dismissible && onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Ionicons name="close" size={16} color={config.textColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  contentContainer: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
});

export default Alert;