// src/components/DevLoginButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

const DevLoginButton = () => {
  // Ne rien afficher si ce n'est pas en mode développement
  if (!__DEV__) return null;
  
  const { login, isAuthenticated } = useAuth();
  
  // Ne pas afficher si l'utilisateur est déjà connecté
  if (isAuthenticated) return null;
  
  const handleQuickLogin = async (role) => {
    // Données de connexion fictives pour un accès rapide
    const email = role === 'ADMIN' ? 'admin@focep.cm' : 
                 role === 'SUPER_ADMIN' ? 'super.admin@focep.cm' : 
                 'collecteur@focep.cm';
    
    const password = 'password123';
    
    // Connexion rapide
    await login(email, password, role);
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.success }]}
        onPress={() => handleQuickLogin('COLLECTEUR')}
      >
        <Ionicons name="person" size={20} color="white" />
        <Text style={styles.text}>C</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.info }]}
        onPress={() => handleQuickLogin('ADMIN')}
      >
        <Ionicons name="business" size={20} color="white" />
        <Text style={styles.text}>A</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.warning }]}
        onPress={() => handleQuickLogin('SUPER_ADMIN')}
      >
        <Ionicons name="shield" size={20} color="white" />
        <Text style={styles.text}>S</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

export default DevLoginButton;