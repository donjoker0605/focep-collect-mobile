// src/components/ClientList/OptimizedClientList.js
import React, { useCallback, useMemo } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useClients } from '../../hooks/useClients';
import ClientListItem from './ClientListItem';
import ClientListSkeleton from './ClientListSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';
import { useFocusEffect } from '@react-navigation/native';

const OptimizedClientList = ({ collecteurId, onClientPress, searchQuery = '', filter = null }) => {
  const { 
    clients, 
    loading, 
    error, 
    refreshing, 
    hasMore, 
    refreshClients, 
    loadMoreClients,
  } = useClients(collecteurId);
  
  const { t } = useTranslation();
  
  // Rafraîchir la liste quand l'écran obtient le focus
  useFocusEffect(
    useCallback(() => {
      refreshClients();
    }, [refreshClients])
  );
  
  // Mémoriser les clients filtrés pour éviter les calculs inutiles
  const filteredClients = useMemo(() => {
    // Si aucun client, retourner un tableau vide
    if (!clients || clients.length === 0) return [];
    
    // Filtrer par recherche
    let result = clients;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => 
        client.nom?.toLowerCase().includes(query) ||
        client.prenom?.toLowerCase().includes(query) ||
        client.numeroCompte?.includes(query) ||
        client.telephone?.includes(query)
      );
    }
    
    // Appliquer des filtres supplémentaires si nécessaire
    if (filter) {
      if (filter === 'active') {
        result = result.filter(client => client.status === 'active');
      } else if (filter === 'inactive') {
        result = result.filter(client => client.status !== 'active');
      }
    }
    
    return result;
  }, [clients, searchQuery, filter]);
  
  // Extraire une clé unique pour chaque élément
  const keyExtractor = useCallback((item) => item.id.toString(), []);
  
  // Optimiser le rendu des éléments
  const renderItem = useCallback(({ item }) => (
    <ClientListItem
      client={item}
      onPress={() => onClientPress(item)}
    />
  ), [onClientPress]);
  
  // Séparateur optimisé
  const ItemSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);
  
  // Gérer le chargement de plus d'éléments
  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      loadMoreClients();
    }
  }, [hasMore, loading, refreshing, loadMoreClients]);
  
  // Afficher un indicateur de chargement pour le lazy loading
  const ListFooter = useCallback(() => {
    if (!hasMore || filteredClients.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [hasMore, filteredClients.length]);
  
  // Afficher un message si la liste est vide
  const ListEmpty = useCallback(() => {
    if (loading && clients.length === 0) {
      return <ClientListSkeleton />;
    }
    
    let message = t('clientList.empty');
    let icon = 'user-off';
    
    if (searchQuery) {
      message = t('clientList.noSearchResults', { query: searchQuery });
      icon = 'search-off';
    } else if (error) {
      message = t('errors.failedToLoadClients');
      icon = 'alert-circle';
    }
    
    return (
      <EmptyState
        icon={icon}
        message={message}
        action={error ? { label: t('actions.retry'), onPress: refreshClients } : null}
      />
    );
  }, [loading, clients.length, searchQuery, error, t, refreshClients]);
  
  return (
    <FlatList
      data={filteredClients}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      onRefresh={refreshClients}
      refreshing={refreshing}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={10}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={true}
      contentContainerStyle={styles.contentContainer}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default React.memo(OptimizedClientList);