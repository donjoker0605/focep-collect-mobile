import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  FAB,
  Surface,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import ClientService from '../../services/clientService';
import CollecteurService from '../../services/collecteurService';
import JournalService from '../../services/journalService';
import { theme } from '../../theme/theme';

export const HomeCollecteurScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { clients } = useClientStore();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalColleute: 0,
    totalCommission: 0,
  });
  const [journalActif, setJournalActif] = useState(null);
  const [comptesCollecteur, setComptesCollecteur] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  // Fonction pour charger toutes les données
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadClients(),
        loadJournalActif(),
        loadComptesCollecteur(),
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les clients
  const loadClients = async () => {
    try {
      if (user?.id) {
        const clientsData = await ClientService.getClientsByCollecteur(user.id);
        setStats(prev => ({
          ...prev,
          totalClients: clientsData.length,
        }));
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Charger le journal actif
  const loadJournalActif = async () => {
    try {
      if (user?.id) {
        const journal = await JournalService.getJournalActif(user.id);
        setJournalActif(journal);
      }
    } catch (error) {
      console.error('Error loading journal actif:', error);
    }
  };

  // Charger les comptes du collecteur
  const loadComptesCollecteur = async () => {
    try {
      if (user?.id) {
        const comptes = await CollecteurService.getComptesCollecteur(user.id);
        setComptesCollecteur(comptes);
      }
    } catch (error) {
      console.error('Error loading comptes collecteur:', error);
    }
  };

  // Fonction pour rafraîchir les données
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Créer un nouveau journal si aucun n'est actif
  const createNewJournal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await JournalService.createJournal({
        dateDebut: today,
        dateFin: today,
        collecteurId: user.id,
      });
      await loadJournalActif();
      Alert.alert('Succès', 'Nouveau journal créé avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer un nouveau journal');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* En-tête avec informations utilisateur */}
        <Surface style={styles.header}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Title style={styles.userName}>
            {user?.prenom} {user?.nom}
          </Title>
          <Text style={styles.userRole}>Collecteur</Text>
        </Surface>

        {/* État du journal */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Journal du jour</Title>
            {journalActif ? (
              <View>
                <Text>Journal #{journalActif.id}</Text>
                <Text style={styles.journalDate}>
                  {new Date(journalActif.dateDebut).toLocaleDateString('fr-FR')}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('CollecteJournaliere')}
                  style={styles.journalButton}
                >
                  Continuer la collecte
                </Button>
              </View>
            ) : (
              <View>
                <Text>Aucun journal actif</Text>
                <Button
                  mode="contained"
                  onPress={createNewJournal}
                  style={styles.journalButton}
                >
                  Créer un nouveau journal
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalClients}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </Surface>
          <Surface style={styles.statCard}>
            <Text style={styles.statValue}>0 FCFA</Text>
            <Text style={styles.statLabel}>Collecté aujourd'hui</Text>
          </Surface>
        </View>

        {/* Comptes du collecteur */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Mes Comptes</Title>
            {comptesCollecteur && (
              <View>
                <List.Item
                  title="Compte Principal"
                  description={`Solde: ${comptesCollecteur.principal?.solde || 0} FCFA`}
                  left={(props) => <List.Icon {...props} icon="account-cash" />}
                />
                <Divider />
                <List.Item
                  title="Compte Épargne"
                  description={`Solde: ${comptesCollecteur.epargne?.solde || 0} FCFA`}
                  left={(props) => <List.Icon {...props} icon="piggy-bank" />}
                />
                <Divider />
                <List.Item
                  title="Compte Rémunération"
                  description={`Solde: ${comptesCollecteur.remuneration?.solde || 0} FCFA`}
                  left={(props) => <List.Icon {...props} icon="cash" />}
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Actions rapides */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Actions Rapides</Title>
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Clients')}
                style={styles.actionButton}
                icon="account-group"
              >
                Mes Clients
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Journaux')}
                style={styles.actionButton}
                icon="book-open-page-variant"
              >
                Mes Journaux
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bouton flottant pour nouvelle collecte */}
      {journalActif && (
        <FAB
          style={styles.fab}
          icon="plus"
          label="Nouvelle Collecte"
          onPress={() => navigation.navigate('CollecteJournaliere')}
        />
      )}
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
    color: theme.colors.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.primary,
    opacity: 0.8,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  journalDate: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: 8,
  },
  journalButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginVertical: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});