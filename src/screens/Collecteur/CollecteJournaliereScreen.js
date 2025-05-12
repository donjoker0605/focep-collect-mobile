// src/screens/Collecteur/CollecteJournaliereScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';

// Données fictives pour la démo - à remplacer par l'API réelle
const mockClients = [
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Marie',
    numeroCompte: '37305D0100015254',
    solde: 124500.0,
  },
  {
    id: 2,
    nom: 'Martin',
    prenom: 'Jean',
    numeroCompte: '37305D0100015255',
    solde: 56700.0,
  },
  {
    id: 3,
    nom: 'Dubois',
    prenom: 'Sophie',
    numeroCompte: '37305D0100015256',
    solde: 83200.0,
  },
  {
    id: 4,
    nom: 'Bernard',
    prenom: 'Michel',
    numeroCompte: '37305D0100015257',
    solde: 42100.0,
  },
  {
    id: 5,
    nom: 'Thomas',
    prenom: 'Laura',
    numeroCompte: '37305D0100015258',
    solde: 95000.0,
  },
];

const CollecteJournaliereScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('epargne'); // epargne ou retrait
  const [clientsList, setClientsList] = useState(mockClients);
  const [filteredClients, setFilteredClients] = useState(mockClients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [montant, setMontant] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Filtrer les clients en fonction de la recherche
    if (searchQuery.trim() === '') {
      setFilteredClients(clientsList);
    } else {
      const filtered = clientsList.filter(
        client =>
          client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.numeroCompte.includes(searchQuery)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clientsList]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setMontant('');
  };

  const validateMontant = () => {
    const montantValue = parseFloat(montant);
    if (isNaN(montantValue) || montantValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return false;
    }

    if (selectedTab === 'retrait' && montantValue > selectedClient.solde) {
      Alert.alert('Erreur', 'Solde insuffisant pour effectuer ce retrait.');
      return false;
    }

    return true;
  };

  const handleOperation = () => {
    if (!selectedClient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un client.');
      return;
    }

    if (!validateMontant()) {
      return;
    }

    setIsLoading(true);

    // Simuler un appel API
    setTimeout(() => {
      setIsLoading(false);
      
      // Mettre à jour le solde du client localement (pour la démo)
      const montantValue = parseFloat(montant);
      const updatedClients = clientsList.map(client => {
        if (client.id === selectedClient.id) {
          const newSolde = selectedTab === 'epargne' 
            ? client.solde + montantValue 
            : client.solde - montantValue;
          
          return { ...client, solde: newSolde };
        }
        return client;
      });
      
      setClientsList(updatedClients);
      setSelectedClient(null);
      setMontant('');
      
      // Afficher une confirmation
      const message = selectedTab === 'epargne' 
        ? `Épargne de ${montantValue.toFixed(2)} FCFA enregistrée avec succès.` 
        : `Retrait de ${montantValue.toFixed(2)} FCFA effectué avec succès.`;
      
      Alert.alert('Succès', message, [
        { text: 'OK', onPress: () => console.log('OK Pressed') }
      ]);
    }, 1000);
  };

  // Formatage des montants
  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.clientItem,
        selectedClient?.id === item.id && styles.selectedClientItem
      ]}
      onPress={() => handleClientSelect(item)}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.prenom} {item.nom}</Text>
        <Text style={styles.clientAccount}>{item.numeroCompte}</Text>
      </View>
      <View style={styles.clientBalanceContainer}>
        <Text style={styles.clientBalanceLabel}>Solde</Text>
        <Text style={styles.clientBalance}>{formatCurrency(item.solde)} FCFA</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Header
          title="Collecte Journalière"
          showBackButton={false}
          rightComponent={
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          }
        />
        
        <ScrollView style={styles.scrollView}>
          {/* Onglets Épargne/Retrait */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'epargne' && styles.activeTab]}
              onPress={() => setSelectedTab('epargne')}
            >
              <Ionicons
                name="arrow-down-circle-outline"
                size={20}
                color={selectedTab === 'epargne' ? theme.colors.primary : theme.colors.textLight}
              />
              <Text
                style={[styles.tabText, selectedTab === 'epargne' && styles.activeTabText]}
              >
                Épargne
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'retrait' && styles.activeTab]}
              onPress={() => setSelectedTab('retrait')}
            >
              <Ionicons
                name="arrow-up-circle-outline"
                size={20}
                color={selectedTab === 'retrait' ? theme.colors.primary : theme.colors.textLight}
              />
              <Text
                style={[styles.tabText, selectedTab === 'retrait' && styles.activeTabText]}
              >
                Retrait
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recherche de client */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Liste des clients */}
          <View style={styles.clientsListContainer}>
            <Text style={styles.sectionTitle}>Clients ({filteredClients.length})</Text>
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.clientsList}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Ionicons name="people" size={48} color={theme.colors.gray} />
                  <Text style={styles.emptyListText}>Aucun client trouvé</Text>
                </View>
              }
            />
          </View>

          {/* Formulaire d'opération */}
          {selectedClient && (
            <Card style={styles.operationCard}>
              <Text style={styles.operationTitle}>
                {selectedTab === 'epargne' ? 'Épargne' : 'Retrait'}
              </Text>
              
              <View style={styles.clientInfoCard}>
                <Text style={styles.clientInfoTitle}>Client sélectionné</Text>
                <Text style={styles.selectedClientName}>
                  {selectedClient.prenom} {selectedClient.nom}
                </Text>
                <Text style={styles.selectedClientAccount}>
                  {selectedClient.numeroCompte}
                </Text>
                <Text style={styles.selectedClientBalance}>
                  Solde: {formatCurrency(selectedClient.solde)} FCFA
                </Text>
              </View>
              
              <View style={styles.montantContainer}>
                <Text style={styles.montantLabel}>Montant ({selectedTab === 'epargne' ? 'à collecter' : 'à retirer'})</Text>
                <View style={styles.montantInputContainer}>
                  <TextInput
                    style={styles.montantInput}
                    placeholder="0.00"
                    value={montant}
                    onChangeText={setMontant}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                  <Text style={styles.currencyLabel}>FCFA</Text>
                </View>
              </View>
              
              <Button
                title={selectedTab === 'epargne' ? 'Enregistrer l\'épargne' : 'Effectuer le retrait'}
                onPress={handleOperation}
                loading={isLoading}
                disabled={isLoading || !montant}
                fullWidth
              />
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSelectedClient(null)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  notificationButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.small,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...theme.shadows.small,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
  },
  clientsListContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text,
  },
  clientsList: {
    paddingBottom: 8,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    ...theme.shadows.small,
  },
  selectedClientItem: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  clientBalanceContainer: {
    alignItems: 'flex-end',
  },
  clientBalanceLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  operationCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  operationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  clientInfoCard: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  clientInfoTitle: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 6,
  },
  selectedClientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  selectedClientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 6,
  },
  selectedClientBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  montantContainer: {
    marginBottom: 20,
  },
  montantLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  montantInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  montantInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
  currencyLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
});

export default CollecteJournaliereScreen;