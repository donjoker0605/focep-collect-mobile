// src/components/NotificationBadge/NotificationBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

/**
 * Composant NotificationBadge
 * @param {Object} props - Propriétés du composant
 * @param {number} props.count - Nombre de notifications
 * @param {string} props.size - Taille du badge ('small', 'medium', 'large')
 * @param {string} props.color - Couleur du badge
 * @param {string} props.textColor - Couleur du texte
 * @param {boolean} props.showDot - Afficher un simple point au lieu du nombre
 * @param {boolean} props.showIcon - Afficher une icône de notification
 * @param {string} props.iconName - Nom de l'icône (par défaut: 'notifications')
 * @param {Object} props.style - Styles additionnels
 */
const NotificationBadge = ({
  count = 0,
  size = 'medium',
  color = theme.colors.error,
  textColor = theme.colors.white,
  showDot = false,
  showIcon = false,
  iconName = 'notifications',
  style,
}) => {
  // Si count est 0 et qu'on ne veut pas afficher un point, ne rien afficher
  if (count === 0 && !showDot) {
    return null;
  }

  // Déterminer la taille du badge selon la prop size
  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14 };
      case 'medium':
      default:
        return { width: 20, height: 20, fontSize: 12 };
    }
  };

  const badgeSize = getBadgeSize();

  // Si count > 99, afficher "99+"
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons name={iconName} size={24} color={theme.colors.text} />
      )}
      
      <View
        style={[
          styles.badge,
          {
            width: showDot ? badgeSize.width : undefined,
            height: badgeSize.height,
            backgroundColor: color,
            minWidth: showDot ? badgeSize.width : badgeSize.width,
            paddingHorizontal: showDot ? 0 : 4,
          },
        ]}
      >
        {!showDot && (
          <Text style={[styles.text, { fontSize: badgeSize.fontSize, color: textColor }]}>
            {displayCount}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default NotificationBadge;