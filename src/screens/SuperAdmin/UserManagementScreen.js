// src/screens/SuperAdmin/UserManagementScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const UserManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Déterminer si l'utilisateur est un super admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const handleNavigate = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des utilisateurs"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Utilisateurs et structures</Text>
          
          {/* Section Agences - Uniquement pour Super Admin */}
          {isSuperAdmin && (
            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('AgenceManagement')}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="business" size={24} color={theme.colors.white} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Gestion des agences</Text>
                  <Text style={styles.menuDescription}>
                    Créer, modifier et gérer les agences de la microfinance
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </Card>
          )}
          
          {/* Section Administrateurs - Uniquement pour Super Admin */}
          {isSuperAdmin && (
            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('AdminManagement')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.info }]}>
                  <Ionicons name="people" size={24} color={theme.colors.white} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Gestion des administrateurs</Text>
                  <Text style={styles.menuDescription}>
                    Créer et gérer les administrateurs des agences
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </Card>
          )}
          
          {/* Section Collecteurs - Pour tous */}
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('CollecteurManagementScreen')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.success }]}>
                <Ionicons name="person" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Gestion des collecteurs</Text>
                <Text style={styles.menuDescription}>
                  Créer, modifier et gérer les collecteurs
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </Card>
          
          {/* Section Configuration */}
          <Text style={styles.sectionTitle}>Configuration</Text>
          
          {/* Paramètres de collecte */}
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('ParameterManagementScreen')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.warning }]}>
                <Ionicons name="settings" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Paramètres de collecte</Text>
                <Text style={styles.menuDescription}>
                  Définir les règles globales de collecte et commissions
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </Card>
          
          {/* Transfert de comptes */}
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('TransfertCompteScreen')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.secondary }]}>
                <Ionicons name="swap-horizontal" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Transfert de comptes</Text>
                <Text style={styles.menuDescription}>
                  Transférer des clients entre collecteurs
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </Card>
          
          {/* Rapports */}
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('ReportsScreen')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.info }]}>
                <Ionicons name="document-text" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Rapports</Text>
                <Text style={styles.menuDescription}>
                  Générer et consulter les rapports de collecte
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 16,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
});

export default UserManagementScreen;