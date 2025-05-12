// app/admin/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Vérifier l'authentification et le rôle
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    } else if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.replace('/');
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="collecteur-management" />
      <Stack.Screen name="collecteur-creation" />
      <Stack.Screen name="collecteur-detail" />
      <Stack.Screen name="collecteur-clients" />
      <Stack.Screen name="parameter-management" />
      <Stack.Screen name="transfert-compte" />
      <Stack.Screen name="commission-parameters" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}