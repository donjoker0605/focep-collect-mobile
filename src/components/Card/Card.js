// src/components/Card/Card.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import theme from '../../theme';

const Card = ({
  children,
  style,
  onPress,
  elevation = 1,
  border = false,
  rounded = 'medium', // small, medium, large
}) => {
  const cardStyles = [
    styles.card,
    rounded === 'small' && styles.roundedSmall,
    rounded === 'medium' && styles.roundedMedium,
    rounded === 'large' && styles.roundedLarge,
    elevation === 0 && styles.noShadow,
    elevation === 1 && styles.shadowSmall,
    elevation === 2 && styles.shadowMedium,
    elevation === 3 && styles.shadowLarge,
    border && styles.border,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 0,
  },
  roundedSmall: {
    borderRadius: theme.borderRadius.sm,
  },
  roundedMedium: {
    borderRadius: theme.borderRadius.md,
  },
  roundedLarge: {
    borderRadius: theme.borderRadius.lg,
  },
  noShadow: {
    elevation: 0,
    ...(Platform.OS === 'web' && {
      boxShadow: 'none',
    }),
    ...(Platform.OS !== 'web' && {
      shadowOpacity: 0,
    }),
  },
  shadowSmall: {
    elevation: 2,
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    }),
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  shadowMedium: {
    elevation: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    }),
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  shadowLarge: {
    elevation: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
    }),
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

export default Card;