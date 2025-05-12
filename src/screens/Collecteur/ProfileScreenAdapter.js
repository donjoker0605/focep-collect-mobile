import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import theme from '../../theme';

// Comme nous n'avons pas encore un ProfileScreen complet,
// cet adapter lui-même fait office d'écran de profil temporaire
export default function ProfileScreenAdapter() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.prenom?.charAt(0) || ''}
              {user?.nom?.charAt(0) || ''}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
            <Text style={styles.userRole}>{user?.role === 'COLLECTEUR' ? 'Collecteur' : 'Administrateur'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.adresseMail || '-'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Téléphone:</Text>
            <Text style={styles.infoValue}>{user?.telephone || '-'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="id-card-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>CNI:</Text>
            <Text style={styles.infoValue}>{user?.numeroCni || '-'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  infoSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    ...theme.shadows.small,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginLeft: 10,
    marginRight: 8,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'right',
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});