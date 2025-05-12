// src/components/OfflineIndicator/OfflineIndicator.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Utils et theme
import theme from '../../theme';

const OfflineIndicator = ({ onPress }) => {
  // Utiliser le hook pour accéder aux fonctionnalités de synchronisation
  const { isOnline, syncStatus, pendingCount, syncNow } = useOfflineSync();
  
  // États
  const [visible, setVisible] = useState(false);
  
  // Animation pour le bandeau
  const slideAnim = new Animated.Value(-100);
  
  // Gérer l'affichage du bandeau en fonction de l'état de connexion
  useEffect(() => {
    if (!isOnline || pendingCount > 0) {
      setVisible(true);
      
      // Afficher le bandeau avec animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8
      }).start();
    } else {
      // Masquer le bandeau après un délai
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true
        }).start(() => setVisible(false));
      }, 2000);
    }
  }, [isOnline, pendingCount]);
  
  // Si on est en ligne et qu'il n'y a pas d'éléments en attente, ne rien afficher
  if (!visible) {
    return null;
  }
  
  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={onPress || syncNow}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isOnline ? "cloud-upload" : "cloud-offline"}
          size={20}
          color="#FFF"
        />
        
        <Text style={styles.text}>
          {isOnline 
            ? (pendingCount > 0 ? `${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente` : 'Connecté') 
            : "Mode hors ligne activé"}
        </Text>
        
        {isOnline && pendingCount > 0 && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={syncNow}
          >
            <Text style={styles.syncButtonText}>Synchroniser</Text>
          </TouchableOpacity>
        )}
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
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  syncButtonText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 12,
  },
});

export default OfflineIndicator;