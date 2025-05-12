// src/components/DataTable/DataTable.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importer directement depuis le fichier source plutôt que depuis ../index
import EmptyState from '../EmptyState/EmptyState';
import theme from '../../theme';

/**
 * Composant de tableau de données avec pagination et tri
 * 
 * @param {Object} props Les propriétés du composant
 * @param {Array} props.data Données à afficher
 * @param {Array} props.columns Configuration des colonnes
 * @param {Function} props.onRowPress Fonction appelée lors du clic sur une ligne
 * @param {Function} props.onSort Fonction appelée lors du clic sur un en-tête pour trier
 * @param {Function} props.onRefresh Fonction appelée lors du rafraîchissement
 * @param {Function} props.onLoadMore Fonction appelée pour charger plus de données
 * @param {string} props.sortField Champ utilisé pour le tri
 * @param {string} props.sortOrder Ordre de tri ('asc' ou 'desc')
 * @param {boolean} props.loading État de chargement
 * @param {boolean} props.refreshing État de rafraîchissement
 * @param {boolean} props.hasMore Indique s'il y a plus de données à charger
 * @param {string} props.emptyTitle Titre affiché lorsqu'il n'y a pas de données
 * @param {string} props.emptyMessage Message affiché lorsqu'il n'y a pas de données
 * @param {Object} props.style Styles supplémentaires
 */
const DataTable = ({
  data = [],
  columns = [],
  onRowPress,
  onSort,
  onRefresh,
  onLoadMore,
  sortField,
  sortOrder = 'asc',
  loading = false,
  refreshing = false,
  hasMore = false,
  emptyTitle = 'Aucune donnée',
  emptyMessage = 'Il n\'y a aucune donnée à afficher.',
  style,
}) => {
  // État interne pour le tri si onSort n'est pas fourni
  const [localSortField, setLocalSortField] = useState(sortField);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);
  const [localData, setLocalData] = useState(data);
  
  // Utiliser les données locales si onSort n'est pas fourni
  useEffect(() => {
    if (!onSort) {
      let sortedData = [...data];
      if (localSortField) {
        sortedData.sort((a, b) => {
          const valueA = a[localSortField];
          const valueB = b[localSortField];
          
          // Gérer les valeurs nulles ou undefined
          if (valueA === undefined || valueA === null) return localSortOrder === 'asc' ? -1 : 1;
          if (valueB === undefined || valueB === null) return localSortOrder === 'asc' ? 1 : -1;
          
          // Comparer les valeurs selon leur type
          if (typeof valueA === 'string' && typeof valueB === 'string') {
            return localSortOrder === 'asc' 
              ? valueA.localeCompare(valueB) 
              : valueB.localeCompare(valueA);
          }
          
          // Par défaut, comparer comme des nombres
          return localSortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        });
      }
      setLocalData(sortedData);
    } else {
      setLocalData(data);
    }
  }, [data, localSortField, localSortOrder, onSort]);
  
  // Gérer le clic sur un en-tête pour trier
  const handleSort = (field) => {
    if (onSort) {
      // Si le tri est géré par le parent
      const newSortOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(field, newSortOrder);
    } else {
      // Tri local
      const newSortOrder = field === localSortField && localSortOrder === 'asc' ? 'desc' : 'asc';
      setLocalSortField(field);
      setLocalSortOrder(newSortOrder);
    }
  };
  
  // Rendu d'un en-tête de colonne
  const renderColumnHeader = (column) => {
    const isCurrentSortField = column.field === (onSort ? sortField : localSortField);
    const currentSortOrder = onSort ? sortOrder : localSortOrder;
    
    return (
      <TouchableOpacity
        key={column.field}
        style={[
          styles.headerCell,
          { flex: column.flex || 1, width: column.width },
          column.headerStyle,
        ]}
        onPress={() => column.sortable !== false && handleSort(column.field)}
      >
        <Text
          style={[styles.headerText, column.headerTextStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {column.title}
        </Text>
        
        {column.sortable !== false && isCurrentSortField && (
          <Ionicons
            name={currentSortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.text}
            style={styles.sortIcon}
          />
        )}
      </TouchableOpacity>
    );
  };
  
  // Rendu d'une cellule de données
  const renderCell = (item, column, index) => {
    let cellContent;
    
    if (column.render) {
      // Utiliser le rendu personnalisé
      cellContent = column.render(item, index);
    } else {
      // Afficher la valeur brute
      const value = item[column.field];
      cellContent = (
        <Text
          style={[styles.cellText, column.textStyle]}
          numberOfLines={column.lines || 1}
          ellipsizeMode="tail"
        >
          {value !== undefined && value !== null ? value.toString() : ''}
        </Text>
      );
    }
    
    return (
      <View
        key={column.field}
        style={[
          styles.cell,
          { flex: column.flex || 1, width: column.width },
          column.cellStyle,
        ]}
      >
        {cellContent}
      </View>
    );
  };
  
  // Rendu d'une ligne de données
  const renderRow = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={[
          styles.row,
          index % 2 === 1 && styles.rowAlternate,
          onRowPress && styles.rowClickable,
        ]}
        onPress={() => onRowPress && onRowPress(item, index)}
        activeOpacity={onRowPress ? 0.7 : 1}
      >
        {columns.map((column) => renderCell(item, column, index))}
      </TouchableOpacity>
    );
  };
  
  // Rendu du pied de tableau (indicateur de chargement)
  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        {loading && !refreshing && (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        )}
      </View>
    );
  };
  
  // Rendu principal
  return (
    <View style={[styles.container, style]}>
      {/* En-tête du tableau */}
      <View style={styles.header}>
        {columns.map(renderColumnHeader)}
      </View>
      
      {/* Corps du tableau */}
      {loading && !refreshing && data.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : localData.length === 0 ? (
        <EmptyState
          type="empty"
          title={emptyTitle}
          message={emptyMessage}
          containerStyle={styles.emptyContainer}
        />
      ) : (
        <FlatList
          data={localData}
          renderItem={renderRow}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={hasMore ? onLoadMore : null}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    // Remplacer `theme.shadows.small` par les propriétés directes pour éviter l'avertissement
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: theme.colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sortIcon: {
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  rowAlternate: {
    backgroundColor: `${theme.colors.lightGray}40`,
  },
  rowClickable: {
    cursor: 'pointer',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textLight,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 30,
  },
  listContent: {
    flexGrow: 1,
  },
});

export default DataTable;