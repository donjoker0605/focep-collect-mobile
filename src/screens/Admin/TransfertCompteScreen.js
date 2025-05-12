// src/screens/Admin/TransfertCompteScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as HapticsCompat from '../../utils/haptics';

// Components
import {
  Header,
  Card,
  Button,
  SelectInput,
  EmptyState,
  Input
} from '../../components';

// Hooks, API et Utils
import { useAuth } from '../../hooks/useAuth';
import { getCollecteurs } from '../../api/collecteur';
import { getClients } from '../../api/client';
import { transferComptes } from '../../api/compte';
import theme from '../../theme';

const TransfertCompteScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // États
  const [collecteurs, setCollecteurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedSourceCollecteur, setSelectedSourceCollecteur] = useState(null);
  const [selectedDestCollecteur, setSelectedDestCollecteur] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États de chargement
  const [loadingCollecteurs, setLoadingCollecteurs] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState(null);
  
  // Paramètres initiaux de la route
  useEffect(() => {
    // Si un collecteur source est spécifié dans les paramètres
    if (route.params?.sourceCollecteurId) {
      setSelectedSourceCollecteur(route.params.sourceCollecteurId);
    }
    
    // Si des clients sont pré-sélectionnés
    if (route.params?.selectedClientIds) {
      setSelectedClients(route.params.selectedClientIds);
    }
  }, [route.params]);
  
  // Charger la liste des collecteurs
  const loadCollecteurs = useCallback(async () => {
    try {
      setLoadingCollecteurs(true);
      setError(null);
      
      const response = await getCollecteurs();
      
      // Formater les options des collecteurs pour le sélecteur
      const collecteurOptions = response.map(collecteur => ({
        label: `${collecteur.prenom} ${collecteur.nom}`,
        value: collecteur.id,
        data: collecteur
      }));
      
      setCollecteurs(collecteurOptions);
      
      // Si un collecteur source est spécifié, le sélectionner et charger ses clients
      if (route.params?.sourceCollecteurId) {
        const sourceId = route.params.sourceCollecteurId;
        if (collecteurOptions.some(c => c.value === sourceId)) {
          setSelectedSourceCollecteur(sourceId);
          loadClients(sourceId);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des collecteurs:', err);
      setError(err.message || 'Erreur lors du chargement des collecteurs');
    } finally {
      setLoadingCollecteurs(false);
    }
  }, [route.params?.sourceCollecteurId]);
  
  // Charger les clients d'un collecteur
  const loadClients = async (collecteurId) => {
    if (!collecteurId) return;
    
    try {
      setLoadingClients(true);
      setError(null);
      setClients([]);
      
      const response = await getClients({ collecteurId });
      setClients(response);
      
      // Si des clients sont pré-sélectionnés, les filtrer
      if (route.params?.selectedClientIds && route.params.selectedClientIds.length > 0) {
        const validClientIds = response
          .filter(client => route.params.selectedClientIds.includes(client.id))
          .map(client => client.id);
        
        setSelectedClients(validClientIds);
      } else {
        setSelectedClients([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError(err.message || 'Erreur lors du chargement des clients');
    } finally {
      setLoadingClients(false);
    }
  };
  
  // Charger les collecteurs au démarrage
  useEffect(() => {
    loadCollecteurs();
  }, [loadCollecteurs]);
  
  // Gérer le changement de collecteur source
  const handleSourceCollecteurChange = (collecteurId) => {
    setSelectedSourceCollecteur(collecteurId);
    setSelectedClients([]);
    loadClients(collecteurId);
  };
  
  // Gérer le changement de collecteur destination
  const handleDestCollecteurChange = (collecteurId) => {
    setSelectedDestCollecteur(collecteurId);
  };
  
  // Sélectionner ou désélectionner un client
  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
    
    // Feedback haptique
    HapticsCompat.impactAsync(HapticsCompat.ImpactFeedbackStyle.Light);
  };
  
  // Sélectionner ou désélectionner tous les clients
  const toggleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
    
    // Feedback haptique
    HapticsCompat.impactAsync(HapticsCompat.ImpactFeedbackStyle.Medium);
  };
  
  // Filtrer les clients en fonction de la recherche
  const filteredClients = searchQuery 
    ? clients.filter(client => 
        `${client.prenom} ${client.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.numerCompte && client.numerCompte.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : clients;
  
  // Exécuter le transfert
  const handleTransfer = () => {
    if (!selectedSourceCollecteur || !selectedDestCollecteur || selectedClients.length === 0) {
      setError('Veuillez sélectionner un collecteur source, un collecteur destination et au moins un client');
      return;
    }
    
    if (selectedSourceCollecteur === selectedDestCollecteur) {
      setError('Les collecteurs source et destination ne peuvent pas être identiques');
      return;
    }
    
    // Confirmer le transfert
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir transférer ${selectedClients.length} client(s) vers ce collecteur ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Confirmer',
          onPress: executeTransfer
        }
      ]
    );
  };
  
  // Exécuter le transfert
  const executeTransfer = async () => {
    try {
      setTransferring(true);
      setError(null);
      
      const transferData = {
        sourceCollecteurId: selectedSourceCollecteur,
        destinationCollecteurId: selectedDestCollecteur,
        clientIds: selectedClients
      };
      
      await transferComptes(transferData);
      
      // Réinitialiser la sélection
      setSelectedClients([]);
      
      // Recharger les clients
      loadClients(selectedSourceCollecteur);
      
      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'Les clients ont été transférés avec succès.',
        [{ text: 'OK' }]
      );
      
      // Vibration de succès
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erreur lors du transfert des clients:', err);
      setError(err.message || 'Erreur lors du transfert des clients');
      
      // Vibration d'erreur
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Error);
    } finally {
      setTransferring(false);
    }
  };
  
  // Rendu d'un item client
  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.clientItem,
        selectedClients.includes(item.id) && styles.selectedClientItem
      ]}
      onPress={() => toggleClientSelection(item.id)}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.prenom} {item.nom}</Text>
        <Text style={styles.clientNumber}>{item.numerCompte || 'Sans numéro'}</Text>
      </View>
      
      <Ionicons
        name={selectedClients.includes(item.id) ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={selectedClients.includes(item.id) ? theme.colors.primary : theme.colors.gray}
      />
    </TouchableOpacity>
  );
  
  // Rendu du contenu principal
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Transfert de comptes"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* En-tête avec formulaire */}
        <View style={styles.formContainer}>
          <Card style={styles.formCard}>
            <Text style={styles.cardTitle}>Sélection des collecteurs</Text>
            
            <SelectInput
              label="Collecteur source"
              placeholder="Sélectionner un collecteur source"
              value={selectedSourceCollecteur}
              options={collecteurs}
              onChange={handleSourceCollecteurChange}
              disabled={loadingCollecteurs || transferring}
              required={true}
              searchable={true}
            />
            
            <SelectInput
              label="Collecteur destination"
              placeholder="Sélectionner un collecteur destination"
              value={selectedDestCollecteur}
              options={collecteurs.filter(c => c.value !== selectedSourceCollecteur)}
              onChange={handleDestCollecteurChange}
              disabled={!selectedSourceCollecteur || loadingCollecteurs || transferring}
              required={true}
              searchable={true}
            />
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </Card>
        </View>
        
        {/* Liste des clients */}
        <View style={styles.clientsContainer}>
          {loadingClients ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement des clients...</Text>
            </View>
          ) : !selectedSourceCollecteur ? (
            <EmptyState
              type="info"
              title="Aucun collecteur sélectionné"
              message="Veuillez sélectionner un collecteur source pour afficher ses clients."
              icon="people"
            />
          ) : clients.length === 0 ? (
            <EmptyState
              type="no-results"
              title="Aucun client"
              message="Ce collecteur n'a aucun client associé."
              icon="person-outline"
            />
          ) : (
            <View style={styles.clientListContainer}>
              {/* Barre de recherche et sélection */}
              <View style={styles.clientListHeader}>
                <Input
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon="search"
                  style={styles.searchInput}
                  disabled={transferring}
                />
                
                <TouchableOpacity 
                  style={styles.selectAllButton}
                  onPress={toggleSelectAll}
                  disabled={transferring}
                >
                  <Text style={styles.selectAllText}>
                    {selectedClients.length === clients.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Texte d'information sur la sélection */}
              <View style={styles.selectionInfoContainer}>
                <Text style={styles.selectionInfoText}>
                  {selectedClients.length} client(s) sélectionné(s) sur {clients.length}
                </Text>
              </View>
              
              {/* Liste des clients */}
              <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.clientList}
                showsVerticalScrollIndicator={false}
              />
              
              {/* Bouton de transfert */}
              <Button
                title="Transférer les clients sélectionnés"
                onPress={handleTransfer}
                disabled={
                  transferring || 
                  !selectedSourceCollecteur || 
                  !selectedDestCollecteur || 
                  selectedClients.length === 0
                }
                loading={transferring}
                style={styles.transferButton}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  formCard: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  clientsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  clientListContainer: {
    flex: 1,
  },
  clientListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  selectAllButton: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  selectionInfoContainer: {
    marginBottom: 12,
  },
  selectionInfoText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  clientList: {
    paddingBottom: 80,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    ...theme.shadows.small,
  },
  selectedClientItem: {
    backgroundColor: `${theme.colors.primary}10`,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientNumber: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  transferButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});

export default TransfertCompteScreen;