// src/components/ClientFilters/ClientFilters.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';
import { Card, Input, SelectInput } from '../index';

const ClientFilters = ({
  onFiltersChange,
  totalClients = 0,
  filteredCount = 0,
  style
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    hasBalance: null, // null = tous, true = avec solde positif, false = avec solde négatif
    isActive: null, // null = tous, true = actifs, false = inactifs
    hasPhone: null,
    hasCNI: null,
    city: '',
    quarter: '',
    sortBy: 'nom', // nom, solde, dateCreation, derniereActivite
    sortOrder: 'asc' // asc, desc
  });

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      hasBalance: null,
      isActive: null,
      hasPhone: null,
      hasCNI: null,
      city: '',
      quarter: '',
      sortBy: 'nom',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.hasBalance !== null) count++;
    if (filters.isActive !== null) count++;
    if (filters.hasPhone !== null) count++;
    if (filters.hasCNI !== null) count++;
    if (filters.city) count++;
    if (filters.quarter) count++;
    if (filters.sortBy !== 'nom' || filters.sortOrder !== 'asc') count++;
    return count;
  };

  const balanceOptions = [
    { label: 'Tous les clients', value: null },
    { label: 'Avec solde positif', value: true },
    { label: 'Avec solde négatif ou nul', value: false }
  ];

  const statusOptions = [
    { label: 'Tous les statuts', value: null },
    { label: 'Clients actifs', value: true },
    { label: 'Clients inactifs', value: false }
  ];

  const phoneOptions = [
    { label: 'Tous', value: null },
    { label: 'Avec téléphone', value: true },
    { label: 'Sans téléphone', value: false }
  ];

  const cniOptions = [
    { label: 'Tous', value: null },
    { label: 'Avec CNI', value: true },
    { label: 'Sans CNI', value: false }
  ];

  const sortOptions = [
    { label: 'Nom (A-Z)', value: 'nom' },
    { label: 'Solde (croissant)', value: 'solde' },
    { label: 'Date création', value: 'dateCreation' },
    { label: 'Dernière activité', value: 'derniereActivite' }
  ];

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card style={[styles.container, style]}>
      {/* Header du filtre */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Filtres</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.resultsText}>
            {filteredCount} / {totalClients} clients
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.textLight} 
          />
        </View>
      </TouchableOpacity>

      {/* Filtres étendus */}
      {isExpanded && (
        <View style={styles.filtersContent}>
          <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
            {/* Recherche textuelle */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Recherche</Text>
              <Input
                placeholder="Rechercher par nom, prénom ou CNI..."
                value={filters.search}
                onChangeText={(value) => updateFilter('search', value)}
                icon="search"
                clearButtonMode="while-editing"
                style={styles.searchInput}
              />
            </View>

            {/* Filtres par statut */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Statut financier</Text>
              <SelectInput
                placeholder="Filtrer par solde"
                value={filters.hasBalance}
                options={balanceOptions}
                onChange={(value) => updateFilter('hasBalance', value)}
                style={styles.filterSelect}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Statut client</Text>
              <SelectInput
                placeholder="Filtrer par statut"
                value={filters.isActive}
                options={statusOptions}
                onChange={(value) => updateFilter('isActive', value)}
                style={styles.filterSelect}
              />
            </View>

            {/* Filtres par données */}
            <View style={styles.filterRow}>
              <View style={[styles.filterSection, styles.halfWidth]}>
                <Text style={styles.sectionTitle}>Téléphone</Text>
                <SelectInput
                  placeholder="Téléphone"
                  value={filters.hasPhone}
                  options={phoneOptions}
                  onChange={(value) => updateFilter('hasPhone', value)}
                  style={styles.filterSelect}
                />
              </View>

              <View style={[styles.filterSection, styles.halfWidth]}>
                <Text style={styles.sectionTitle}>CNI</Text>
                <SelectInput
                  placeholder="CNI"
                  value={filters.hasCNI}
                  options={cniOptions}
                  onChange={(value) => updateFilter('hasCNI', value)}
                  style={styles.filterSelect}
                />
              </View>
            </View>

            {/* Filtres par localisation */}
            <View style={styles.filterRow}>
              <View style={[styles.filterSection, styles.halfWidth]}>
                <Text style={styles.sectionTitle}>Ville</Text>
                <Input
                  placeholder="Ville"
                  value={filters.city}
                  onChangeText={(value) => updateFilter('city', value)}
                  style={styles.locationInput}
                />
              </View>

              <View style={[styles.filterSection, styles.halfWidth]}>
                <Text style={styles.sectionTitle}>Quartier</Text>
                <Input
                  placeholder="Quartier"
                  value={filters.quarter}
                  onChangeText={(value) => updateFilter('quarter', value)}
                  style={styles.locationInput}
                />
              </View>
            </View>

            {/* Tri */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Tri</Text>
              <View style={styles.sortContainer}>
                <SelectInput
                  placeholder="Trier par"
                  value={filters.sortBy}
                  options={sortOptions}
                  onChange={(value) => updateFilter('sortBy', value)}
                  style={styles.sortSelect}
                />
                
                <TouchableOpacity
                  style={[styles.sortOrderButton, filters.sortOrder === 'desc' && styles.sortOrderButtonActive]}
                  onPress={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <Ionicons 
                    name={filters.sortOrder === 'asc' ? "arrow-up" : "arrow-down"} 
                    size={16} 
                    color={filters.sortOrder === 'desc' ? theme.colors.white : theme.colors.textLight} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              <Ionicons name="refresh" size={16} color={theme.colors.textLight} />
              <Text style={[styles.clearButtonText, activeFiltersCount === 0 && styles.disabledText]}>
                Effacer ({activeFiltersCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginRight: 8,
  },
  filtersContent: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray + '20',
    paddingTop: 16,
  },
  filtersScroll: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterSelect: {
    marginBottom: 0,
  },
  locationInput: {
    marginBottom: 0,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortSelect: {
    flex: 1,
    marginBottom: 0,
  },
  sortOrderButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray + '40',
  },
  sortOrderButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray + '20',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default ClientFilters;