// components/ClientInput/ClientInput.js - VERSION SIMPLIFIÉE TEMPORAIRE

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientService } from '../../services';
import theme from '../../theme';

/**
 * Version simplifiée du composant ClientInput
 * Cette version utilise les services existants sans le hook useClientSearch
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

  // Synchroniser avec le client sélectionné du parent
  useEffect(() => {
    if (selectedClient) {
      setClientName(selectedClient.displayName || `${selectedClient.prenom} ${selectedClient.nom}`);
      setAccountNumber(selectedClient.numeroCompte || '');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedClient]);

  // Recherche de clients avec debounce simple
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
      
      const response = await clientService.getClientsByCollecteur(collecteurId, { 
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

      const response = await clientService.getClientsByCollecteur(collecteurId, { size: 1000 });
      
      if (response.success && response.data) {
        const clients = Array.isArray(response.data) ? response.data : [];
        const matchingClient = clients.find(client => client.numeroCompte === account);

        if (matchingClient) {
          const formattedClient = {
            id: matchingClient.id,
            nom: matchingClient.nom,
            prenom: matchingClient.prenom,
            numeroCompte: matchingClient.numeroCompte,
            numeroCni: matchingClient.numeroCni,
            telephone: matchingClient.telephone,
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
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Champ nom client */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Nom du client <Text style={styles.required}>*</Text>
        </Text>
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
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowSuggestions(!showSuggestions)}
              disabled={disabled || loading}
            >
              <Ionicons 
                name={showSuggestions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.gray} 
              />
            </TouchableOpacity>
          </View>
          {renderSuggestions()}
        </View>
      </View>

      {/* Champ numéro de compte */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Numéro de compte <Text style={styles.required}>*</Text>
        </Text>
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
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
    padding: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
});

export default ClientInput;