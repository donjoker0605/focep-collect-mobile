// app/index.tsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { View, ActivityIndicator, Text } from 'react-native';
import theme from '../src/theme';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    console.log('État d\'authentification:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);

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
    console.log('Non authentifié, redirection vers /auth');
    return <Redirect href="/auth" />;
  }

  // Rediriger vers l'écran approprié en fonction du rôle
  console.log(`Authentifié en tant que ${user?.role}, redirection...`);
  
  if (user?.role === 'ADMIN') {
    return <Redirect href="/admin" />;
  } else if (user?.role === 'SUPER_ADMIN') {
    return <Redirect href="/super-admin" />;
  } else {
    return <Redirect href="/(tabs)" />;
  }
}