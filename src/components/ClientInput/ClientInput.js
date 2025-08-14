// components/ClientInput/ClientInput.js - VERSION AMÉLIORÉE AVEC DROPDOWN

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Input from '../Input/Input';
import clientService from '../../services/clientService';
import theme from '../../theme';

/**
 * Composant ClientInput amélioré avec :
 * - Liaison bidirectionnelle parfaite
 * - Dropdown avec tous les clients
 * - Recherche semi-automatique
 * - Validation téléphone
 */
const ClientInput = ({
  collecteurId,
  selectedClient,
  onClientSelect,
  onError,
  disabled = false,
  style
}) => {
  
  const [clientName, setClientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 NOUVEAU : État pour dropdown complet
  const [allClients, setAllClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // Synchroniser avec le client sélectionné du parent
  useEffect(() => {
    if (selectedClient) {
      setClientName(selectedClient.displayName || `${selectedClient.prenom} ${selectedClient.nom}`);
      setAccountNumber(selectedClient.numeroCompte || '');
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      // Reset complet quand pas de client sélectionné
      setClientName('');
      setAccountNumber('');
      setSuggestions([]);
      setShowSuggestions(false);
      setError(null);
    }
  }, [selectedClient]);

  // 🔥 NOUVEAU : Charger tous les clients pour le dropdown
  const loadAllClients = async () => {
    if (!collecteurId || dropdownLoading) return;

    try {
      setDropdownLoading(true);
      setError(null);
      
      const response = await clientService.getAllClients({ 
        collecteurId: collecteurId,
        size: 1000 // Récupérer tous les clients
      });

      if (response.success && response.data) {
        const clients = Array.isArray(response.data) ? response.data : [];
        const formattedClients = clients.map(client => ({
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          numeroCompte: client.numeroCompte,
          numeroCni: client.numeroCni,
          telephone: client.telephone,
          valide: client.valide, // 🔥 AJOUT : Statut d'activation du client
          displayName: `${client.prenom} ${client.nom}`,
          hasPhone: !!(client.telephone && client.telephone.trim() !== '')
        }));

        setAllClients(formattedClients);
      }
    } catch (err) {
      console.error('Erreur chargement clients:', err);
      setError('Erreur lors du chargement des clients');
      onError?.(err.message);
    } finally {
      setDropdownLoading(false);
    }
  };

  // Recherche de clients avec debounce
  useEffect(() => {
    if (clientName.length > 2) {
      const timeoutId = setTimeout(() => {
        searchClients(clientName);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [clientName, collecteurId]);

  // Recherche par numéro de compte
  useEffect(() => {
    if (accountNumber.length > 3) {
      const timeoutId = setTimeout(() => {
        searchByAccount(accountNumber);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [accountNumber, collecteurId]);

  const searchClients = async (query) => {
    if (!collecteurId || loading) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await clientService.getAllClients({ 
        collecteurId: collecteurId,
        size: 20, 
        search: query 
      });

      if (response.success && response.data) {
        const clients = Array.isArray(response.data) ? response.data : [];
        const formattedClients = clients.map(client => ({
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          numeroCompte: client.numeroCompte,
          numeroCni: client.numeroCni,
          telephone: client.telephone,
          valide: client.valide, // 🔥 AJOUT : Statut d'activation du client
          displayName: `${client.prenom} ${client.nom}`,
          hasPhone: !!(client.telephone && client.telephone.trim() !== '')
        }));

        setSuggestions(formattedClients);
        setShowSuggestions(true);

        // Vérifier correspondance exacte
        const exactMatch = formattedClients.find(client => 
          client.displayName.toLowerCase() === query.toLowerCase()
        );

        if (exactMatch) {
          handleClientSelect(exactMatch);
        }
      }
    } catch (err) {
      console.error('Erreur recherche clients:', err);
      setError('Erreur lors de la recherche');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchByAccount = async (account) => {
    if (!collecteurId || loading) return;

    try {
      setLoading(true);
      setError(null);

      const response = await clientService.getAllClients({ 
        collecteurId: collecteurId,
        size: 1000 
      });
      
      if (response.success && response.data) {
        const clients = Array.isArray(response.data) ? response.data : [];
        const matchingClient = clients.find(client => client.numeroCompte === account.trim());

        if (matchingClient) {
          const formattedClient = {
            id: matchingClient.id,
            nom: matchingClient.nom,
            prenom: matchingClient.prenom,
            numeroCompte: matchingClient.numeroCompte,
            numeroCni: matchingClient.numeroCni,
            telephone: matchingClient.telephone,
            valide: matchingClient.valide, // 🔥 AJOUT : Statut d'activation du client
            displayName: `${matchingClient.prenom} ${matchingClient.nom}`,
            hasPhone: !!(matchingClient.telephone && matchingClient.telephone.trim() !== '')
          };

          setClientName(formattedClient.displayName);
          handleClientSelect(formattedClient);
        }
      }
    } catch (err) {
      console.error('Erreur recherche par compte:', err);
      setError('Erreur lors de la recherche par compte');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client) => {
    setClientName(client.displayName);
    setAccountNumber(client.numeroCompte);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowDropdown(false);
    setError(null);
    onClientSelect?.(client);
  };

  const handleClientNameChange = (text) => {
    setClientName(text);
    setError(null);
    
    if (!text.trim()) {
      setAccountNumber('');
      setSuggestions([]);
      setShowSuggestions(false);
      onClientSelect?.(null);
    }
  };

  const handleAccountNumberChange = (text) => {
    setAccountNumber(text);
    setError(null);
    
    if (!text.trim()) {
      if (!clientName) {
        setClientName('');
        onClientSelect?.(null);
      }
    }
  };

  // 🔥 NOUVEAU : Gestionnaire du dropdown
  const handleDropdownToggle = () => {
    if (showDropdown) {
      setShowDropdown(false);
    } else {
      if (allClients.length === 0) {
        loadAllClients();
      }
      setShowDropdown(true);
    }
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView style={styles.suggestionsScroll} nestedScrollEnabled>
          {suggestions.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.suggestionItem}
              onPress={() => handleClientSelect(client)}
              disabled={disabled}
            >
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionName}>{client.displayName}</Text>
                <Text style={styles.suggestionAccount}>
                  Compte: {client.numeroCompte}
                </Text>
                {client.numeroCni && (
                  <Text style={styles.suggestionCni}>CNI: {client.numeroCni}</Text>
                )}
              </View>
              <View style={styles.suggestionMeta}>
                {!client.hasPhone && (
                  <Ionicons 
                    name="call-outline" 
                    size={16} 
                    color={theme.colors.warning} 
                  />
                )}
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={theme.colors.textLight} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 🔥 NOUVEAU : Dropdown modal complet
  const renderDropdownModal = () => {
    return (
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un client</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDropdown(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {dropdownLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement des clients...</Text>
              </View>
            ) : (
              <ScrollView style={styles.clientsList}>
                {allClients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientItem}
                    onPress={() => handleClientSelect(client)}
                  >
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.displayName}</Text>
                      <Text style={styles.clientAccount}>
                        Compte: {client.numeroCompte || 'Non défini'}
                      </Text>
                      {client.numeroCni && (
                        <Text style={styles.clientCni}>CNI: {client.numeroCni}</Text>
                      )}
                    </View>
                    <View style={styles.clientMeta}>
                      {!client.hasPhone && (
                        <Ionicons 
                          name="call-outline" 
                          size={16} 
                          color={theme.colors.warning} 
                        />
                      )}
                      <Ionicons 
                        name="chevron-forward" 
                        size={16} 
                        color={theme.colors.textLight} 
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderClientInfo = () => {
    if (!selectedClient) return null;

    return (
      <View style={styles.clientInfoContainer}>
        <View style={styles.clientInfoHeader}>
          <Ionicons name="person-circle" size={24} color={theme.colors.success} />
          <Text style={styles.clientInfoTitle}>Client sélectionné</Text>
        </View>
        
        <View style={styles.clientInfoDetails}>
          <Text style={styles.clientInfoName}>{selectedClient.displayName}</Text>
          <Text style={styles.clientInfoAccount}>
            Compte: {selectedClient.numeroCompte}
          </Text>
          
          {/* Indicateur téléphone */}
          <View style={styles.phoneIndicator}>
            <Ionicons 
              name={selectedClient.hasPhone ? "call" : "call-outline"} 
              size={16} 
              color={selectedClient.hasPhone ? theme.colors.success : theme.colors.warning} 
            />
            <Text style={[
              styles.phoneText,
              { color: selectedClient.hasPhone ? theme.colors.success : theme.colors.warning }
            ]}>
              {selectedClient.hasPhone ? "Téléphone OK" : "Pas de téléphone"}
            </Text>
          </View>
          
          {/* 🔥 NOUVEAU : Indicateur statut activation */}
          <View style={styles.statusIndicator}>
            <Ionicons 
              name={selectedClient.valide ? "checkmark-circle" : "alert-circle"} 
              size={16} 
              color={selectedClient.valide ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[
              styles.statusText,
              { color: selectedClient.valide ? theme.colors.success : theme.colors.error }
            ]}>
              {selectedClient.valide ? "Client activé" : "Client non activé"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Champ nom client */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.fieldLabel}>Nom du client </Text>
          <Text style={styles.required}>*</Text>
        </View>
        <View style={styles.inputWithSuggestions}>
          <View style={styles.inputContainer}>
            <Input
              placeholder="Rechercher un client..."
              value={clientName}
              onChangeText={handleClientNameChange}
              error={error}
              disabled={disabled || loading}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              rightIcon={loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : selectedClient ? (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              ) : null}
              style={styles.nameInput}
            />
            {/* 🔥 NOUVEAU : Bouton dropdown */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={handleDropdownToggle}
              disabled={disabled || loading}
            >
              <Ionicons 
                name={showDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          {renderSuggestions()}
        </View>
      </View>

      {/* Champ numéro de compte */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.fieldLabel}>Numéro de compte </Text>
          <Text style={styles.required}>*</Text>
        </View>
        <Input
          placeholder="Numéro de compte du client"
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
          disabled={disabled || loading}
          rightIcon={selectedClient ? (
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          ) : null}
          style={styles.accountInput}
        />
      </View>

      {/* Info client sélectionné */}
      {renderClientInfo()}

      {/* Indicateur de recherche */}
      {(clientName || accountNumber) && !selectedClient && (
        <View style={styles.statusIndicator}>
          <Ionicons 
            name="search" 
            size={16} 
            color={loading ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={styles.statusText}>
            {loading ? "Recherche en cours..." : "Aucun client correspondant"}
          </Text>
        </View>
      )}

      {/* 🔥 NOUVEAU : Modal dropdown */}
      {renderDropdownModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  required: {
    color: theme.colors.error,
  },
  inputWithSuggestions: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  nameInput: {
    flex: 1,
    marginRight: 0,
  },
  accountInput: {
    flex: 1,
    marginRight: 0,
  },
  dropdownButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
    zIndex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    zIndex: 1000,
    ...theme.shadows.medium,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  suggestionAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  suggestionCni: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 1,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // 🔥 NOUVEAU : Styles modal dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  clientsList: {
    maxHeight: 400,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  clientCni: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 1,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientInfoContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: `${theme.colors.success}08`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${theme.colors.success}20`,
  },
  clientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.success,
    marginLeft: 8,
    flex: 1,
  },
  clientInfoDetails: {
    gap: 4,
  },
  clientInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  clientInfoAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  phoneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phoneText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
});

export default ClientInput;