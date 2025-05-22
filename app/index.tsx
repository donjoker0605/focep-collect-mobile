// app/index.tsx - VERSION CORRIGÉE
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { View, ActivityIndicator, Text } from 'react-native';
import theme from '../src/theme';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Si l'authentification est en cours, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, color: theme.colors.text }}>
          Chargement de l'application...
        </Text>
      </View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  // CORRECTION CRITIQUE : Normaliser le rôle pour la comparaison
  const normalizedRole = user?.role?.replace('ROLE_', '');
  
  console.log(`Authentifié en tant que ${normalizedRole}, redirection...`);
  
  switch(normalizedRole) {
    case 'ADMIN':
      return <Redirect href="/admin" />;
    case 'SUPER_ADMIN':
      return <Redirect href="/super-admin" />;
    case 'COLLECTEUR':
      return <Redirect href="/(tabs)" />;
    default:
      console.error('Rôle non reconnu:', user?.role);
      // Redirection vers une page d'erreur ou déconnexion
      return <Redirect href="/auth" />;
  }
}