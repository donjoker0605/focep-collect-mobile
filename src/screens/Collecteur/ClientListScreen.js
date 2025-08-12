// src/screens/Collecteur/ClientListScreen.js - VERSION AMÉLIORÉE COMPATIBLE ADMIN/COLLECTEUR
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import useClients from '../../hooks/useClients';
import { formatCurrency } from '../../utils/formatters';
import balanceCalculationService from '../../services/balanceCalculationService';

const ClientListScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { collecteurId: routeCollecteurId } = route?.params || {}; // Pour les admins qui veulent voir les clients d'un collecteur spécifique
  
  // 🔥 UTILISATION DU HOOK AMÉLIORÉ
  const {
    clients,
    loading,
    error,
    refreshing,
    hasMore,
    userRole,
    canAccess,
    refreshClients,
    loadMoreClients,
    searchClients,
    toggleClientStatus,
    clearError,
    debugAccess,
    testAccess,
    totalClients
  } = useClients(routeCollecteurId);

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebug, setShowDebug] = useState(__DEV__); // Afficher debug seulement en développement
  const [debugInfo, setDebugInfo] = useState(null);

  // 🔍 GESTION DE LA RECHERCHE
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (text.length === 0) {
      // Recharger tous les clients si recherche vide
      refreshClients();
    } else if (text.length >= 2) {
      // Rechercher seulement si 2 caractères minimum
      searchClients(text);
    }
  }, [refreshClients, searchClients]);

  // 🎯 NAVIGATION VERS DÉTAILS CLIENT
  const handleClientPress = useCallback((client) => {
    console.log('🎯 Navigation vers client:', client.id);
    
    // Adapter la navigation selon le rôle
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      navigation.navigate('ClientDetail', {
        client: client,
        clientId: client.id,
        isAdminView: true
      });
    } else {
      navigation.navigate('ClientDetail', {
        client: client,
        clientId: client.id
      });
    }
  }, [navigation, userRole]);

  // ➕ NAVIGATION VERS CRÉATION CLIENT
  const handleAddClient = useCallback(() => {
    navigation.navigate('ClientAddEdit', { mode: 'add' });
  }, [navigation]);

  // 🔄 CHANGEMENT DE STATUT CLIENT (seulement pour admins)
  const handleToggleClientStatus = useCallback(async (client) => {
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent modifier le statut des clients');
      return;
    }

    const newStatus = !client.valide;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} le client ${client.prenom} ${client.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const result = await toggleClientStatus(client.id, newStatus);
            if (result.success) {
              Alert.alert('Succès', `Client ${action} avec succès`);
            } else {
              Alert.alert('Erreur', result.error);
            }
          }
        }
      ]
    );
  }, [userRole, toggleClientStatus]);

  // 🧪 FONCTIONS DE DEBUG (développement seulement)
  const handleDebugAccess = useCallback(async () => {
    if (!__DEV__) return;
    
    const result = await debugAccess();
    setDebugInfo(result);
    console.log('🔍 Debug accès complet:', result);
  }, [debugAccess]);

  const handleTestAccess = useCallback(async () => {
    if (!__DEV__) return;
    
    const result = await testAccess();
    console.log('🧪 Test accès complet:', result);
    Alert.alert(
      'Test d\'accès',
      `Tests: ${result.summary?.passed || 0}/${result.summary?.totalTests || 0} réussis\n` +
      `Rôle: ${result.user?.role || 'Inconnu'}\n` +
      `Erreurs: ${result.summary?.failed || 0}`,
      [{ text: 'OK' }]
    );
  }, [testAccess]);

  // 🔄 GESTION DES ERREURS
  useEffect(() => {
    if (error) {
      console.error('❌ Erreur ClientListScreen:', error);
      
      if (error.includes('Session expirée') || error.includes('non authentifié')) {
        Alert.alert(
          'Session expirée',
          'Veuillez vous reconnecter',
          [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
        );
      } else if (error.includes('Accès non autorisé')) {
        Alert.alert(
          'Accès refusé',
          'Vous n\'avez pas les permissions nécessaires pour voir les clients',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erreur', error, [{ text: 'OK', onPress: clearError }]);
      }
    }
  }, [error, navigation, clearError]);

  // 🎨 RENDU D'UN ITEM CLIENT
  const renderClientItem = useCallback(({ item }) => {
    console.log('🎨 Rendu client:', item.id);
    
    return (
      <Card style={styles.clientCard}>
        <TouchableOpacity onPress={() => handleClientPress(item)}>
          <View style={styles.clientHeader}>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {item.prenom} {item.nom}
              </Text>
              <Text style={styles.clientDetails}>
                CNI: {item.numeroCni}
              </Text>
              <Text style={styles.clientDetails}>
                Tél: {item.telephone}
              </Text>
              {item.numeroCompte && (
                <Text style={styles.clientAccount}>
                  Compte: #{item.numeroCompte}
                </Text>
              )}
              
              {/* Soldes */}
              <View style={styles.balanceSection}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Solde Total:</Text>
                  <Text style={[styles.balanceValue, { color: theme.colors.primary }]}>
                    {formatCurrency(item.soldeTotal || 0)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Solde Disponible:</Text>
                  <Text style={[styles.balanceValue, { color: theme.colors.success }]}>
                    {formatCurrency(item.soldeDisponible || item.soldeTotal || 0)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.clientActions}>
              {/* Badge de statut */}
              <View style={[
                styles.statusBadge,
                item.valide ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: item.valide ? theme.colors.white : theme.colors.white }
                ]}>
                  {item.valide ? 'Actif' : 'Inactif'}
                </Text>
              </View>
              
              {/* Bouton de changement de statut pour admins */}
              {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                <TouchableOpacity
                  style={styles.statusToggle}
                  onPress={() => handleToggleClientStatus(item)}
                >
                  <Ionicons 
                    name={item.valide ? "toggle" : "toggle-outline"} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              )}
              
              {/* Flèche de navigation */}
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={theme.colors.textLight} 
              />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  }, [handleClientPress, handleToggleClientStatus, userRole]);

  // 🎨 RENDU COMPOSANT PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={
          routeCollecteurId 
            ? "Clients du collecteur" 
            : userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' 
              ? "Tous les clients" 
              : "Mes Clients"
        }
        showBackButton={!!routeCollecteurId}
        onBackPress={routeCollecteurId ? () => navigation.goBack() : null}
        rightComponent={
          <View style={styles.headerActions}>
            {/* Debug button (dev only) */}
            {showDebug && (
              <TouchableOpacity onPress={handleDebugAccess} style={styles.debugButton}>
                <Ionicons name="bug" size={20} color="white" />
              </TouchableOpacity>
            )}
            
            {/* Add client button */}
            <TouchableOpacity onPress={handleAddClient}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
      
      <View style={styles.content}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.textLight} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleSearch('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {totalClients} client{totalClients > 1 ? 's' : ''} • 
            Rôle: {userRole || 'Chargement...'}
            {routeCollecteurId && ` • Collecteur: ${routeCollecteurId}`}
          </Text>
        </View>

        {/* Debug Info (dev only) */}
        {showDebug && debugInfo && (
          <Card style={styles.debugCard}>
            <Text style={styles.debugTitle}>🔍 Debug Info</Text>
            <Text style={styles.debugText}>
              Accès: {debugInfo.success ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Endpoint: {debugInfo.endpoint || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Erreur: {debugInfo.error || 'Aucune'}
            </Text>
            <TouchableOpacity onPress={handleTestAccess} style={styles.testButton}>
              <Text style={styles.testButtonText}>🧪 Lancer test complet</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Liste des clients */}
        {!canAccess ? (
          <View style={styles.noAccessContainer}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.textLight} />
            <Text style={styles.noAccessText}>
              Accès non autorisé aux données clients
            </Text>
            <Text style={styles.noAccessSubtext}>
              Veuillez vérifier vos permissions ou vous reconnecter
            </Text>
          </View>
        ) : loading && clients.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des clients...</Text>
          </View>
        ) : (
          <FlatList
            data={clients}
            renderItem={renderClientItem}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={refreshClients}
                colors={[theme.colors.primary]}
              />
            }
            onEndReached={loadMoreClients}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={theme.colors.textLight} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity onPress={handleAddClient} style={styles.addFirstClientButton}>
                    <Text style={styles.addFirstClientText}>Ajouter le premier client</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              loading && clients.length > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loadingMoreText}>Chargement...</Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
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
    paddingTop: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    marginRight: 10,
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 25,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearButton: {
    padding: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  debugCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
  testButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffeaa7',
    borderRadius: 4,
    alignItems: 'center',
  },
  balanceSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButtonText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  clientCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
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
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusToggle: {
    marginRight: 8,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  addFirstClientButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  addFirstClientText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textLight,
  },
});

export default ClientListScreen;