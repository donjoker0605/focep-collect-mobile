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
  SearchBar,
  List,
  IconButton,
  Badge,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import { theme } from '../../theme/theme';

export const ClientsScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { 
    clients, 
    fetchClients, 
    isLoading, 
    error,
    selectClient,
  } = useClientStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);

  // Charger les clients au montage
  useEffect(() => {
    if (user?.id) {
      loadClients();
    }
  }, [user]);

  // Filtrer les clients selon la recherche
  useEffect(() => {
    if (searchQuery) {
      const filtered = clients.filter(client =>
        `${client.nom} ${client.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.numeroCni?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telephone?.includes(searchQuery)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clients, searchQuery]);

  const loadClients = async () => {
    if (user?.id) {
      const result = await fetchClients(user.id);
      if (!result.success) {
        Alert.alert('Erreur', 'Impossible de charger les clients');
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const navigateToClientDetail = (client) => {
    selectClient(client);
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const navigateToCreateClient = () => {
    navigation.navigate('CreateClient');
  };

  const renderClientItem = (client) => (
    <Card key={client.id} style={styles.clientCard}>
      <Card.Content>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Title style={styles.clientName}>
              {client.nom} {client.prenom}
            </Title>
            <Text style={styles.clientDetails}>
              CNI: {client.numeroCni}
            </Text>
            <Text style={styles.clientDetails}>
              Tel: {client.telephone}
            </Text>
            <Text style={styles.clientDetails}>
              {client.ville}, {client.quartier}
            </Text>
          </View>
          <View style={styles.clientActions}>
            <Badge 
              style={[styles.badge, client.valide ? styles.activeBadge : styles.inactiveBadge]}
            >
              {client.valide ? 'Actif' : 'Inactif'}
            </Badge>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => navigateToClientDetail(client)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement des clients...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Mes Clients</Title>
        <Text style={styles.subtitle}>
          {clients.length} client{clients.length > 1 ? 's' : ''}
        </Text>
      </View>

      <Surface style={styles.searchContainer}>
        <SearchBar
          placeholder="Rechercher un client..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </Surface>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredClients.length > 0 ? (
          filteredClients.map(renderClientItem)
        ) : (
          <Surface style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
            </Text>
            {!searchQuery && (
              <Button
                mode="outlined"
                onPress={navigateToCreateClient}
                style={styles.emptyButton}
              >
                Ajouter un client
              </Button>
            )}
          </Surface>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        label="Nouveau Client"
        onPress={navigateToCreateClient}
      />
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
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: 4,
  },
  searchContainer: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  searchBar: {
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clientCard: {
    marginBottom: 12,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  clientDetails: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  clientActions: {
    alignItems: 'center',
  },
  badge: {
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: theme.colors.primary,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});