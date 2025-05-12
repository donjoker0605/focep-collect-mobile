import { Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Rediriger vers l'application principale si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="security-pin" />
      <Stack.Screen name="new-password" />
    </Stack>
  );
}