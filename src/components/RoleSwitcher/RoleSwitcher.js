// src/components/RoleSwitcher/RoleSwitcher.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Button/Button';
import theme from '../../theme';

const RoleSwitcher = () => {
  const { user, switchRole } = useAuth();
  
  const handleSwitchRole = async (role) => {
    await switchRole(role);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mode développement : Changement de rôle</Text>
        <Text style={styles.subtitle}>Rôle actuel : {user?.role || 'Non connecté'}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <Button 
          title="Collecteur" 
          onPress={() => handleSwitchRole('COLLECTEUR')}
          variant={user?.role === 'COLLECTEUR' ? 'filled' : 'outlined'}
          style={styles.button}
        />
        
        <Button 
          title="Admin" 
          onPress={() => handleSwitchRole('ADMIN')}
          variant={user?.role === 'ADMIN' ? 'filled' : 'outlined'}
          style={styles.button}
        />
        
        <Button 
          title="Super Admin" 
          onPress={() => handleSwitchRole('SUPER_ADMIN')}
          variant={user?.role === 'SUPER_ADMIN' ? 'filled' : 'outlined'}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderStyle: 'dashed',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    ...theme.fonts.style.h5,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...theme.fonts.style.bodySmall,
    color: theme.colors.textLight,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default RoleSwitcher;