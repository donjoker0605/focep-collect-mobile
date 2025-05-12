// src/components/DevQuickLogin.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import theme from '../theme';

const DevQuickLogin = () => {
  // Ne pas afficher en production
  if (!__DEV__) return null;
  
  const { switchRole, user, isAuthenticated } = useAuth();
  
  // Fonction pour changer de rôle
  const handleRoleChange = async (role) => {
    await switchRole(role);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mode développement</Text>
      <Text style={styles.subtitle}>
        {isAuthenticated 
          ? `Connecté en tant que: ${user?.role}` 
          : 'Non connecté'}
      </Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, 
            user?.role === 'COLLECTEUR' && styles.activeButton,
            { backgroundColor: theme.colors.success + '20' }
          ]}
          onPress={() => handleRoleChange('COLLECTEUR')}
        >
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={user?.role === 'COLLECTEUR' ? theme.colors.success : theme.colors.gray} 
          />
          <Text style={[styles.buttonText, 
            user?.role === 'COLLECTEUR' && styles.activeButtonText,
            { color: theme.colors.success }
          ]}>
            Collecteur
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, 
            user?.role === 'ADMIN' && styles.activeButton,
            { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={() => handleRoleChange('ADMIN')}
        >
          <Ionicons 
            name="business-outline" 
            size={20} 
            color={user?.role === 'ADMIN' ? theme.colors.primary : theme.colors.gray} 
          />
          <Text style={[styles.buttonText, 
            user?.role === 'ADMIN' && styles.activeButtonText,
            { color: theme.colors.primary }
          ]}>
            Admin
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, 
            user?.role === 'SUPER_ADMIN' && styles.activeButton,
            { backgroundColor: theme.colors.warning + '20' }
          ]}
          onPress={() => handleRoleChange('SUPER_ADMIN')}
        >
          <Ionicons 
            name="shield-outline" 
            size={20} 
            color={user?.role === 'SUPER_ADMIN' ? theme.colors.warning : theme.colors.gray} 
          />
          <Text style={[styles.buttonText, 
            user?.role === 'SUPER_ADMIN' && styles.activeButtonText,
            { color: theme.colors.warning }
          ]}>
            Super Admin
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 300,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    color: theme.colors.textLight,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  activeButtonText: {
    fontWeight: 'bold',
  },
});

export default DevQuickLogin;