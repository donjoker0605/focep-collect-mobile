// app/super-admin/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SuperAdminLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Vérifier l'authentification et le rôle
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    } else if (user?.role !== 'SUPER_ADMIN') {
      router.replace('/');
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="user-management" />
      <Stack.Screen name="agence-management" />
      <Stack.Screen name="agence-creation" />
      <Stack.Screen name="agence-detail" />
      <Stack.Screen name="admin-management" />
      <Stack.Screen name="admin-creation" />
      <Stack.Screen name="admin-detail" />
    </Stack>
  );
}