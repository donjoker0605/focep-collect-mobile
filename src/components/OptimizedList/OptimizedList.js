// src/components/OptimizedList/OptimizedList.js
import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  Dimensions,
} from 'react-native';
import theme from '../../theme';
import EmptyState from '../EmptyState/EmptyState';

const OptimizedList = ({
  data = [],
  renderItem,
  keyExtractor,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  error = null,
  hasMore = false,
  ListHeaderComponent = null,
  ListFooterComponent = null,
  EmptyComponent = null,
  emptyMessage = "Aucun élément à afficher",
  emptyIcon = "inbox-outline",
  separatorHeight = 1,
  separatorColor = theme.colors.lightGray,
  contentPadding = 16,
  numColumns = 1,
  itemHeight = null, // Hauteur fixe optionnelle pour de meilleures performances
  onScroll = null,
  ...props
}) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const flatListRef = useRef(null);
  
  // Gérer les changements de dimensions de l'écran
  const onLayout = useCallback(() => {
    setDimensions(Dimensions.get('window'));
  }, []);
  
  // Séparateur d'éléments mémorisé
  const ItemSeparatorComponent = useCallback(() => (
    <View
      style={[
        styles.separator,
        {
          height: separatorHeight,
          backgroundColor: separatorColor,
        },
      ]}
    />
  ), [separatorHeight, separatorColor]);
  
  // Pied de liste par défaut (indicateur de chargement)
  const DefaultFooter = useCallback(() => {
    if (!hasMore || data.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [hasMore, data.length]);
  
  // État vide par défaut
  const DefaultEmptyComponent = useCallback(() => {
    if (loading && data.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    
    if (error) {
      return (
        <EmptyState
          icon="alert-circle"
          message={error.message || "Une erreur est survenue"}
          action={{ label: "Réessayer", onPress: onRefresh }}
        />
      );
    }
    
    return (
      <EmptyState
        icon={emptyIcon}
        message={emptyMessage}
      />
    );
  }, [loading, data.length, error, onRefresh, emptyIcon, emptyMessage]);
  
  // Défilement vers le haut
  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);
  
  // Défilement vers un élément spécifique
  const scrollToItem = useCallback((item, options = {}) => {
    if (flatListRef.current && item) {
      flatListRef.current.scrollToItem({
        item,
        animated: options.animated !== false,
        viewPosition: options.viewPosition || 0,
      });
    }
  }, []);
  
  // Optimisation du chargement initial
  const getItemLayout = itemHeight ? (data, index) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }) : undefined;
  
  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent || DefaultFooter}
      ListEmptyComponent={EmptyComponent || DefaultEmptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      onEndReached={hasMore ? onEndReached : null}
      onEndReachedThreshold={0.5}
      onLayout={onLayout}
      onScroll={onScroll}
      maxToRenderPerBatch={10}
      windowSize={21} // Affiche environ 10 éléments au-dessus et en dessous de la fenêtre visible
      initialNumToRender={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      getItemLayout={getItemLayout}
      numColumns={numColumns}
      contentContainerStyle={[
        styles.contentContainer,
        { padding: contentPadding },
        data.length === 0 && styles.emptyContentContainer,
      ]}
      style={styles.list}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    marginVertical: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default React.memo(OptimizedList);