// src/components/ErrorNotification/ErrorNotification.js
import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ErrorNotification = ({ message, severity = 'error', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (message) {
      setVisible(true);
      
      // Animer l'entrée
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Configurer la fermeture automatique
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleClose = () => {
    // Animer la sortie
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      if (onClose) onClose();
    });
  };

  // Ne rien rendre si pas de message ou pas visible
  if (!message || !visible) {
    return null;
  }

  // Déterminer la couleur en fonction de la sévérité
  const getSeverityColor = () => {
    switch (severity) {
      case 'info':
        return theme.colors.info;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
      default:
        return theme.colors.error;
    }
  };

  // Icône en fonction de la sévérité
  const getSeverityIcon = () => {
    switch (severity) {
      case 'info':
        return 'information-circle';
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
      default:
        return 'alert-circle';
    }
  };

  const backgroundColor = getSeverityColor();
  const iconName = getSeverityIcon();

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ 
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, 0],
            }) 
          }],
          opacity: animation,
          marginTop: insets.top,
          backgroundColor
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color="white" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
});

export default ErrorNotification;