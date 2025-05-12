// src/components/Card/Card.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
    // Utiliser boxShadow au lieu de shadowOpacity
    boxShadow: 'none',
  },
  shadowSmall: {
    // Pour React Native Web, utiliser boxShadow
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    // Pour React Native mobile, conserver elevation
    elevation: 2,
  },
  shadowMedium: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  shadowLarge: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

export default Card;