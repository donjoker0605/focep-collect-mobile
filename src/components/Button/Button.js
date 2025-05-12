// src/components/Button/Button.js
import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import theme from '../../theme';

const Button = ({
  title,
  onPress,
  variant = 'filled', // filled, outlined, text
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  // Déterminer les styles en fonction des propriétés
  const getButtonStyles = () => {
    let buttonStyle = styles.button;
    
    // Variante
    if (variant === 'filled') {
      buttonStyle = { ...buttonStyle, ...styles.filled };
    } else if (variant === 'outlined') {
      buttonStyle = { ...buttonStyle, ...styles.outlined };
    } else if (variant === 'text') {
      buttonStyle = { ...buttonStyle, ...styles.text };
    }
    
    // Taille
    if (size === 'small') {
      buttonStyle = { ...buttonStyle, ...styles.small };
    } else if (size === 'large') {
      buttonStyle = { ...buttonStyle, ...styles.large };
    }
    
    // Largeur
    if (fullWidth) {
      buttonStyle = { ...buttonStyle, ...styles.fullWidth };
    }
    
    // Désactivé
    if (disabled) {
      buttonStyle = { ...buttonStyle, ...styles.disabled };
    }
    
    return buttonStyle;
  };
  
  const getTextStyles = () => {
    let textStyleVar = styles.buttonText;
    
    if (variant === 'outlined' || variant === 'text') {
      textStyleVar = { ...textStyleVar, ...styles.outlinedText };
    }
    
    if (disabled) {
      textStyleVar = { ...textStyleVar, ...styles.disabledText };
    }
    
    if (size === 'small') {
      textStyleVar = { ...textStyleVar, ...styles.smallText };
    } else if (size === 'large') {
      textStyleVar = { ...textStyleVar, ...styles.largeText };
    }
    
    return textStyleVar;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'filled' ? theme.colors.white : theme.colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filled: {
    backgroundColor: theme.colors.primary,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: theme.colors.gray,
    borderColor: theme.colors.gray,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlinedText: {
    color: theme.colors.primary,
  },
  disabledText: {
    color: theme.colors.white,
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
});

export default Button;