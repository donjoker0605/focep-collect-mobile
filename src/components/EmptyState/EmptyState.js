// src/components/EmptyState/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../Button/Button';
import theme from '../../theme';

const EmptyState = ({
  // Types: 'empty', 'loading', 'error', 'no-results', 'no-connection', 'custom'
  type = 'empty',
  title = 'Aucune donnée',
  message = 'Il n\'y a aucun élément à afficher pour le moment.',
  icon,
  iconSize = 64,
  iconColor = theme.colors.gray,
  actionButton,
  actionButtonTitle = 'Réessayer',
  onActionButtonPress,
  loading = false,
  customIcon,
  containerStyle,
}) => {
  // Déterminer l'icône à afficher selon le type
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'loading':
        return 'hourglass';
      case 'error':
        return 'alert-circle';
      case 'no-results':
        return 'search';
      case 'no-connection':
        return 'cloud-offline';
      case 'empty':
      default:
        return 'documents';
    }
  };
  
  // Déterminer le titre selon le type
  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'loading':
        return 'Chargement en cours...';
      case 'error':
        return 'Une erreur est survenue';
      case 'no-results':
        return 'Aucun résultat';
      case 'no-connection':
        return 'Pas de connexion Internet';
      case 'empty':
      default:
        return 'Aucune donnée';
    }
  };
  
  // Déterminer le message selon le type
  const getMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'loading':
        return 'Veuillez patienter pendant le chargement des données.';
      case 'error':
        return 'Une erreur s\'est produite lors du chargement des données. Veuillez réessayer.';
      case 'no-results':
        return 'Aucun résultat ne correspond à votre recherche.';
      case 'no-connection':
        return 'Vérifiez votre connexion Internet et réessayez.';
      case 'empty':
      default:
        return 'Il n\'y a aucun élément à afficher pour le moment.';
    }
  };
  
  const renderIcon = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }
    
    if (customIcon) {
      return customIcon;
    }
    
    return <Ionicons name={getIcon()} size={iconSize} color={iconColor} />;
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        {renderIcon()}
        
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.message}>{getMessage()}</Text>
        
        {(type === 'error' || type === 'no-connection' || actionButton) && onActionButtonPress && (
          <Button
            title={actionButtonTitle}
            onPress={onActionButtonPress}
            style={styles.actionButton}
            size="small"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 24,
  },
});

export default EmptyState;