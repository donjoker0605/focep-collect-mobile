// src/screens/Admin/CollecteurDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';

const CollecteurDetailScreen = ({ navigation, route }) => {
  const { collecteur } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [collecteurDetails, setCollecteurDetails] = useState(null);
  const [clientsCount, setClientsCount] = useState(0);
  const [collecteStats, setCollecteStats] = useState({
    totalEpargne: 0,
    totalRetrait: 0,
    montantCommission: 0,
  });

  useEffect(() => {
    // Si un collecteur est passé en paramètre, l'utiliser directement
    if (collecteur) {
      setCollecteurDetails(collecteur);
      // Simuler le chargement des statistiques
      fetchCollecteurStats();
    } else {
      // Afficher une erreur
      Alert.alert('Erreur', 'Aucun collecteur sélectionné');
      navigation.goBack();
    }
  }, [collecteur]);

  const fetchCollecteurStats = () => {
    // Simuler une requête API
    setTimeout(() => {
      setClientsCount(collecteur.totalClients || 0);
      setCollecteStats({
        totalEpargne: 3750000,
        totalRetrait: 1250000,
        montantCommission: 75000,
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleEditCollecteur = () => {
    navigation.navigate('CollecteurEditScreen', { collecteur: collecteurDetails });
  };

  const handleToggleStatus = () => {
    const newStatus = collecteurDetails.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';

    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir ${action} ce collecteur ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: () => {
            setIsLoading(true);
            
            // Simuler une requête API
            setTimeout(() => {
              setCollecteurDetails({
                ...collecteurDetails,
                status: newStatus,
              });
              
              setIsLoading(false);
              
              Alert.alert(
                'Succès',
                `Le collecteur a été ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès.`
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const handleViewClients = () => {
    navigation.navigate('CollecteurClients', { collecteurId: collecteurDetails.id });
  };

  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  if (isLoading || !collecteurDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail du collecteur"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Détail du collecteur"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditCollecteur}
          >
            <Ionicons name="create-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.contentContainer}>
          {/* Profil du collecteur */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {collecteurDetails.prenom.charAt(0)}{collecteurDetails.nom.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.collecteurName}>{collecteurDetails.prenom} {collecteurDetails.nom}</Text>
                <Text style={styles.collecteurEmail}>{collecteurDetails.adresseMail}</Text>
                
                <View style={[
                  styles.statusBadge,
                  collecteurDetails.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {collecteurDetails.status === 'active' ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="id-card-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>CNI:</Text>
                  <Text style={styles.detailValue}>{collecteurDetails.numeroCni || 'Non renseigné'}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Tél:</Text>
                  <Text style={styles.detailValue}>{collecteurDetails.telephone}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Agence:</Text>
                  <Text style={styles.detailValue}>{collecteurDetails.agence.nomAgence}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Max. retrait:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(collecteurDetails.montantMaxRetrait)} FCFA</Text>
                </View>
              </View>
            </View>
          </Card>
          
          {/* Statistiques */}
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>{clientsCount}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="arrow-down-outline" size={24} color={theme.colors.success} />
                <Text style={styles.statValue}>{formatCurrency(collecteStats.totalEpargne)} FCFA</Text>
                <Text style={styles.statLabel}>Total Épargne</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="arrow-up-outline" size={24} color={theme.colors.error} />
                <Text style={styles.statValue}>{formatCurrency(collecteStats.totalRetrait)} FCFA</Text>
                <Text style={styles.statLabel}>Total Retrait</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="wallet-outline" size={24} color={theme.colors.warning} />
                <Text style={styles.statValue}>{formatCurrency(collecteStats.montantCommission)} FCFA</Text>
                <Text style={styles.statLabel}>Commission</Text>
              </View>
            </View>
          </Card>
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewClientsButton]}
              onPress={handleViewClients}
            >
              <Ionicons name="people" size={24} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>Voir les clients</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                collecteurDetails.status === 'active' ? styles.disableButton : styles.enableButton
              ]}
              onPress={handleToggleStatus}
            >
              <Ionicons
                name={collecteurDetails.status === 'active' ? "close-circle" : "checkmark-circle"}
                size={24}
                color={theme.colors.white}
              />
              <Text style={styles.actionButtonText}>
                {collecteurDetails.status === 'active' ? 'Désactiver' : 'Activer'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.commissionButton]}
              onPress={() => navigation.navigate('CommissionParameters', { collecteurId: collecteurDetails.id })}
            >
              <Ionicons name="settings" size={24} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>Paramètres de commission</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  collecteurEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginHorizontal: 4,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statsCard: {
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  viewClientsButton: {
    backgroundColor: theme.colors.primary,
  },
  disableButton: {
    backgroundColor: theme.colors.error,
  },
  enableButton: {
    backgroundColor: theme.colors.success,
  },
  commissionButton: {
    backgroundColor: theme.colors.info,
  },
});

export default CollecteurDetailScreen;