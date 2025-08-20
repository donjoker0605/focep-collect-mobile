// src/screens/SuperAdmin/CollecteurDetailScreen.js
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
import theme from '../../theme';

const CollecteurDetailScreen = ({ navigation, route }) => {
  const { collecteur } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [collecteurDetails, setCollecteurDetails] = useState(null);
  const [clients, setClients] = useState([]);
  const [comptes, setComptes] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clientsExpanded, setClientsExpanded] = useState(false);

  useEffect(() => {
    if (collecteur && collecteur.id) {
      fetchCollecteurDetails();
    } else {
      Alert.alert('Erreur', 'Aucun collecteur sélectionné');
      navigation.goBack();
    }
  }, [collecteur]);

  const fetchCollecteurDetails = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les détails du collecteur
      const response = await superAdminService.getCollecteurDetails(collecteur.id);
      
      if (response.success) {
        setCollecteurDetails(response.data);
      }

      // Récupérer les clients du collecteur
      const clientsResponse = await superAdminService.getClientsByCollecteur(collecteur.id);
      if (clientsResponse.success) {
        setClients(clientsResponse.data);
      }

      // Récupérer les comptes (si l'API existe)
      // TODO: Implémenter l'endpoint pour les comptes collecteur
      
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du collecteur');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCollecteurDetails();
    setRefreshing(false);
  };

  const handleViewClient = (client) => {
    navigation.navigate('ClientDetail', { client });
  };

  const handleEditCollecteur = () => {
    navigation.navigate('CollecteurCreation', {
      mode: 'edit',
      collecteur: collecteurDetails || collecteur
    });
  };

  const handleToggleStatus = async () => {
    try {
      const action = collecteurDetails?.active ? 'désactiver' : 'activer';
      Alert.alert(
        'Confirmation',
        `Voulez-vous ${action} ce collecteur ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: async () => {
              const response = await superAdminService.toggleCollecteurStatus(collecteur.id);
              if (response.success) {
                Alert.alert('Succès', response.message);
                fetchCollecteurDetails();
              } else {
                Alert.alert('Erreur', response.error);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Détails Collecteur"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const details = collecteurDetails || collecteur;

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Détails Collecteur"
        onBack={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleEditCollecteur}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleToggleStatus}
              style={styles.actionButton}
            >
              <Ionicons 
                name={details?.active ? "close-circle-outline" : "checkmark-circle-outline"} 
                size={24} 
                color={theme.colors.white} 
              />
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
              backgroundColor: details?.active ? theme.colors.success : theme.colors.error 
            }]}>
              <Text style={styles.statusText}>
                {details?.active ? 'Actif' : 'Inactif'}
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
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{details?.adresseMail}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{details?.telephone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Agence</Text>
              <Text style={styles.infoValue}>{details?.agenceNom || 'Non assigné'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ancienneté</Text>
              <Text style={styles.infoValue}>
                {details?.ancienneteSummary || `${details?.ancienneteEnMois || 0} mois`}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Niveau</Text>
              <Text style={[styles.infoValue, styles.niveauText]}>
                {details?.niveauAnciennete || 'NOUVEAU'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date création</Text>
              <Text style={styles.infoValue}>{formatDate(details?.dateCreation)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Montant max retrait</Text>
              <Text style={styles.infoValue}>{formatMontant(details?.montantMaxRetrait)}</Text>
            </View>
          </View>
        </Card>

        {/* Comptes financiers */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Comptes Financiers</Text>
          </View>
          
          <View style={styles.comptesGrid}>
            <StatsCard
              title="Compte Salaire"
              value={formatMontant(details?.soldeSalaire || 0)}
              icon="cash"
              color={theme.colors.success}
              subtitle="Rémunérations"
            />
            <StatsCard
              title="Compte Manquant"
              value={formatMontant(details?.soldeManquant || 0)}
              icon="warning-outline"
              color={(details?.soldeManquant || 0) < 0 ? theme.colors.error : theme.colors.warning}
              subtitle="Déficits/Surplus"
            />
            <StatsCard
              title="Compte Service"
              value={formatMontant(details?.soldeService || 0)}
              icon="settings"
              color={theme.colors.info}
              subtitle="Services"
            />
          </View>
          
          {/* Résumé total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Solde Total Collecteur</Text>
            <Text style={[styles.totalValue, {
              color: (details?.soldeTotal || 0) >= 0 ? theme.colors.success : theme.colors.error
            }]}>
              {formatMontant(details?.soldeTotal || 0)}
            </Text>
          </View>
        </Card>

        {/* Liste des clients avec fonction déroulante */}
        <Card style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setClientsExpanded(!clientsExpanded)}
          >
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Clients ({clients.length})</Text>
            <Ionicons 
              name={clientsExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {clientsExpanded && (
            clients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>Aucun client assigné</Text>
              </View>
            ) : (
              <View style={styles.clientsList}>
                {clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientItem}
                    onPress={() => handleViewClient(client)}
                  >
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.nomComplet}</Text>
                      <Text style={styles.clientDetails}>
                        {client.telephone} • {client.valide ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                    <View style={styles.clientActions}>
                      <Text style={styles.clientBalance}>
                        {formatMontant(client.soldeTotal || 0)}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
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
              title="Clients Actifs"
              value={details?.nombreClientsActifs || 0}
              icon="people"
              color={theme.colors.success}
              subtitle={`sur ${details?.nombreClients || 0} total`}
            />
            <StatsCard
              title="Coeff. Ancienneté"
              value={`${((details?.coefficientAnciennete || 1) * 100).toFixed(0)}%`}
              icon="trending-up"
              color={theme.colors.warning}
              subtitle="Bonus commission"
            />
            <StatsCard
              title="Performance"
              value={details?.nombreClients > 10 ? "Excellente" : details?.nombreClients > 5 ? "Bonne" : "En cours"}
              icon="analytics"
              color={details?.nombreClients > 10 ? theme.colors.success : details?.nombreClients > 5 ? theme.colors.warning : theme.colors.info}
              subtitle="Basée sur nb clients"
            />
          </View>
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
  comptesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  clientsList: {
    marginTop: 8,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
    marginRight: 8,
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
    flexWrap: 'wrap',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  totalCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  niveauText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

export default CollecteurDetailScreen;