// src/screens/SuperAdmin/ClientDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import StatsCard from '../../components/StatsCard/StatsCard';
import superAdminService from '../../services/superAdminService';
import balanceCalculationService from '../../services/balanceCalculationService';
import theme from '../../theme';

const ClientDetailScreen = ({ navigation, route }) => {
  const { client } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [clientDetails, setClientDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (client && client.id) {
      fetchClientDetails();
      calculateBalances();
    } else {
      Alert.alert('Erreur', 'Aucun client sélectionné');
      navigation.goBack();
    }
  }, [client]);

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true);
      
      // Note: Adapter selon votre API réelle
      // Pour l'instant, on utilise les données passées en paramètres
      setClientDetails(client);
      
      // TODO: Récupérer les transactions du client si l'API existe
      // const transactionsResponse = await superAdminService.getClientTransactions(client.id);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du client');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBalances = async () => {
    try {
      if (balanceCalculationService && client) {
        const balance = await balanceCalculationService.calculateClientAvailableBalance(client);
        setBalanceInfo(balance);
      }
    } catch (error) {
      console.error('Erreur calcul soldes:', error);
      // En cas d'erreur, utiliser les données de base
      setBalanceInfo({
        soldeTotal: client.soldeTotal || 0,
        soldeDisponible: client.soldeTotal || 0,
        commissionSimulee: 0
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClientDetails();
    await calculateBalances();
    setRefreshing(false);
  };

  const handleViewCollecteur = () => {
    if (clientDetails?.collecteurId) {
      navigation.navigate('CollecteurDetail', { 
        collecteur: { 
          id: clientDetails.collecteurId,
          nom: 'Collecteur', // Vous devrez récupérer les vraies infos
          prenom: 'de ce client'
        } 
      });
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export des données',
      'Voulez-vous exporter les données de ce client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Exporter', 
          onPress: () => {
            // TODO: Implémenter l'export des données client
            Alert.alert('Info', 'Fonction d\'export à implémenter');
          }
        }
      ]
    );
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCommissionSummary = () => {
    if (clientDetails?.commissionSummary) return clientDetails.commissionSummary;
    if (clientDetails?.commissionInherited) return 'Hérite de l\'agence';
    return 'Paramètres personnalisés';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Détails Client"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const details = clientDetails || client;

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Détails Client"
        onBack={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleExportData}
              style={styles.actionButton}
            >
              <Ionicons name="download-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Informations personnelles */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Informations Personnelles</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: details?.valide ? theme.colors.success : theme.colors.error 
            }]}>
              <Text style={styles.statusText}>
                {details?.valide ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nom complet</Text>
              <Text style={styles.infoValue}>{details?.nomComplet || `${details?.prenom} ${details?.nom}`}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>CNI</Text>
              <Text style={styles.infoValue}>{details?.numeroCni}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{details?.telephone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date création</Text>
              <Text style={styles.infoValue}>{formatDate(details?.dateCreation)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Localisation</Text>
              <Text style={styles.infoValue}>{details?.locationSummary || 'Non renseignée'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>{details?.fullAddress || 'Non renseignée'}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.collecteurLink}
            onPress={handleViewCollecteur}
          >
            <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.collecteurText}>
              Voir le collecteur responsable
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Données financières */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Données Financières</Text>
          </View>
          
          <View style={styles.balanceGrid}>
            <StatsCard
              title="Solde Total"
              value={formatMontant(balanceInfo?.soldeTotal || 0)}
              icon="cash"
              color={theme.colors.primary}
              subtitle="Épargne totale"
              style={styles.balanceCard}
            />
            <StatsCard
              title="Solde Disponible"
              value={formatMontant(balanceInfo?.soldeDisponible || 0)}
              icon="card"
              color={theme.colors.success}
              subtitle="Après commission"
              style={styles.balanceCard}
            />
          </View>

          {balanceInfo?.commissionSimulee > 0 && (
            <View style={styles.commissionInfo}>
              <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
              <Text style={styles.commissionText}>
                Commission simulée: {formatMontant(balanceInfo.commissionSimulee)}
              </Text>
            </View>
          )}
          
          <View style={styles.commissionParams}>
            <Text style={styles.commissionLabel}>Paramètres de commission:</Text>
            <Text style={styles.commissionValue}>{getCommissionSummary()}</Text>
          </View>
        </Card>

        {/* Historique des transactions */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Historique Transactions</Text>
          </View>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Aucune transaction récente</Text>
              <Text style={styles.emptySubtext}>
                L'historique des transactions apparaîtra ici
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>{transaction.type}</Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'EPARGNE' ? theme.colors.success : theme.colors.error }
                  ]}>
                    {transaction.type === 'EPARGNE' ? '+' : '-'}{formatMontant(transaction.montant)}
                  </Text>
                </View>
              ))}
              
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Voir toutes les transactions</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Statistiques */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Statistiques</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <StatsCard
              title="Statut Compte"
              value={details?.valide ? 'Actif' : 'Inactif'}
              icon="checkmark-circle"
              color={details?.valide ? theme.colors.success : theme.colors.error}
              subtitle="État du compte"
            />
            <StatsCard
              title="Source Localisation"
              value={details?.locationSource || 'NONE'}
              icon="location"
              color={theme.colors.info}
              subtitle="Mode géolocalisation"
            />
          </View>
        </Card>

        {/* Section audit (lecture seule pour SuperAdmin) */}
        <Card style={styles.section}>
          <View style={styles.auditHeader}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.warning} />
            <Text style={styles.auditTitle}>Mode Consultation SuperAdmin</Text>
          </View>
          <Text style={styles.auditText}>
            ⚠️ Vous consultez ce client en mode lecture seule. 
            Seul le collecteur assigné ou l'admin de l'agence peut modifier ces informations.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  collecteurLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  collecteurText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceCard: {
    width: '48%',
  },
  commissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commissionText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginLeft: 8,
    fontWeight: '600',
  },
  commissionParams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  commissionValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  transactionsList: {
    marginTop: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginLeft: 8,
  },
  auditText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default ClientDetailScreen;