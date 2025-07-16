// components/ClientInput/ClientInput.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../Input';
import theme from '../../theme';

/**
 * Composant optimisé pour la saisie client avec liaison bidirectionnelle
 * Utilise le hook useClientSearch pour une UX parfaite
 */
const ClientInput = ({
  collecteurId,
  selectedClient,
  onClientSelect,
  onError,
  disabled = false,
  style
}) => {
  
  const {
    clientName,
    accountNumber,
    selectedClient: hookSelectedClient,
    nameSuggestions,
    accountSuggestions,
    showNameSuggestions,
    showAccountSuggestions,
    loading,
    error,
    handleClientNameChange,
    handleAccountNumberChange,
    handleNameSuggestionSelect,
    handleAccountSuggestionSelect,
    setShowNameSuggestions,
    setShowAccountSuggestions,
    hasSelectedClient,
    isSynced,
    lastUpdateSource
  } = useClientSearch(collecteurId);

  // Synchroniser avec le parent
  React.useEffect(() => {
    if (hookSelectedClient && hookSelectedClient !== selectedClient) {
      onClientSelect?.(hookSelectedClient);
    }
  }, [hookSelectedClient, selectedClient, onClientSelect]);

  // Notifier les erreurs au parent
  React.useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // ========================================
  // 🎨 COMPOSANTS DE RENDU
  // ========================================

  const renderNameSuggestions = () => {
    if (!showNameSuggestions || nameSuggestions.length === 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView style={styles.suggestionsScroll} nestedScrollEnabled>
          {nameSuggestions.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.suggestionItem}
              onPress={() => handleNameSuggestionSelect(client)}
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

  const renderAccountSuggestions = () => {
    if (!showAccountSuggestions || accountSuggestions.length === 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView style={styles.suggestionsScroll} nestedScrollEnabled>
          {accountSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.numeroCompte}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleAccountSuggestionSelect(suggestion)}
              disabled={disabled}
            >
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionAccount}>
                  {suggestion.numeroCompte}
                </Text>
                {suggestion.displayName && suggestion.type !== 'account' && (
                  <Text style={styles.suggestionName}>{suggestion.displayName}</Text>
                )}
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={theme.colors.textLight} 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderClientInfo = () => {
    if (!hasSelectedClient || !isSynced) return null;

    return (
      <View style={styles.clientInfoContainer}>
        <View style={styles.clientInfoHeader}>
          <Ionicons name="person-circle" size={24} color={theme.colors.success} />
          <Text style={styles.clientInfoTitle}>Client sélectionné</Text>
          <View style={styles.syncIndicator}>
            <Ionicons name="sync" size={16} color={theme.colors.success} />
            <Text style={styles.syncText}>Synchronisé</Text>
          </View>
        </View>
        
        <View style={styles.clientInfoDetails}>
          <Text style={styles.clientInfoName}>{hookSelectedClient.displayName}</Text>
          <Text style={styles.clientInfoAccount}>
            Compte: {hookSelectedClient.numeroCompte}
          </Text>
          {hookSelectedClient.numeroCni && (
            <Text style={styles.clientInfoCni}>
              CNI: {hookSelectedClient.numeroCni}
            </Text>
          )}
          
          {/* Indicateur téléphone */}
          <View style={styles.phoneIndicator}>
            <Ionicons 
              name={hookSelectedClient.hasPhone ? "call" : "call-outline"} 
              size={16} 
              color={hookSelectedClient.hasPhone ? theme.colors.success : theme.colors.warning} 
            />
            <Text style={[
              styles.phoneText,
              { color: hookSelectedClient.hasPhone ? theme.colors.success : theme.colors.warning }
            ]}>
              {hookSelectedClient.hasPhone ? "Téléphone OK" : "Pas de téléphone"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ========================================
  // 🎨 RENDU PRINCIPAL
  // ========================================

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
                if (nameSuggestions.length > 0) {
                  setShowNameSuggestions(true);
                }
              }}
              rightIcon={loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : hasSelectedClient && lastUpdateSource === 'name' ? (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              ) : null}
              style={styles.nameInput}
            />
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowNameSuggestions(!showNameSuggestions)}
              disabled={disabled || loading}
            >
              <Ionicons 
                name={showNameSuggestions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.gray} 
              />
            </TouchableOpacity>
          </View>
          {renderNameSuggestions()}
        </View>
      </View>

      {/* Champ numéro de compte */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Numéro de compte <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputWithSuggestions}>
          <View style={styles.inputContainer}>
            <Input
              placeholder="Numéro de compte du client"
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              disabled={disabled || loading}
              onFocus={() => {
                if (accountSuggestions.length > 0) {
                  setShowAccountSuggestions(true);
                }
              }}
              rightIcon={hasSelectedClient && lastUpdateSource === 'account' ? (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              ) : null}
              style={styles.accountInput}
            />
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowAccountSuggestions(!showAccountSuggestions)}
              disabled={disabled || loading}
            >
              <Ionicons 
                name={showAccountSuggestions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.gray} 
              />
            </TouchableOpacity>
          </View>
          {renderAccountSuggestions()}
        </View>
      </View>

      {/* Info client sélectionné */}
      {renderClientInfo()}

      {/* Indicateur de liaison */}
      {(clientName || accountNumber) && !hasSelectedClient && (
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

// ========================================
// 🎨 STYLES
// ========================================

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
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncText: {
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 4,
    fontWeight: '500',
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
  clientInfoCni: {
    fontSize: 12,
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