// src/components/FilterBar/FilterBar.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from '../DatePicker/DatePicker';
import theme from '../../theme';

const FilterBar = ({
  filters = [],
  onFilterChange,
  style,
  searchEnabled = true,
  searchPlaceholder = 'Rechercher...',
  searchValue = '',
  onSearchChange,
  compact = false,
  onFilterReset,
  maxDisplayedFilters = 3,
  maxHeight,
}) => {
  const [activeFilterModal, setActiveFilterModal] = useState(null);
  const [activeValues, setActiveValues] = useState({});
  const [showAllFilters, setShowAllFilters] = useState(false);
  
  // Filtres visibles et cachés
  const visibleFilters = compact && !showAllFilters 
    ? filters.slice(0, maxDisplayedFilters) 
    : filters;
  
  const hasMoreFilters = compact && filters.length > maxDisplayedFilters;
  
  // Gérer le changement d'un filtre
  const handleFilterChange = (filterId, value) => {
    const newActiveValues = { ...activeValues, [filterId]: value };
    setActiveValues(newActiveValues);
    
    if (onFilterChange) {
      onFilterChange(newActiveValues);
    }
  };
  
  // Ouvrir le modal d'un filtre
  const openFilterModal = (filter) => {
    setActiveFilterModal(filter);
  };
  
  // Appliquer le filtre sélectionné et fermer le modal
  const applyFilter = (filterId, value) => {
    handleFilterChange(filterId, value);
    setActiveFilterModal(null);
  };
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setActiveValues({});
    
    if (onFilterReset) {
      onFilterReset();
    }
  };
  
  // Supprimer un filtre actif
  const removeFilter = (filterId) => {
    const newActiveValues = { ...activeValues };
    delete newActiveValues[filterId];
    setActiveValues(newActiveValues);
    
    if (onFilterChange) {
      onFilterChange(newActiveValues);
    }
  };
  
  // Rendu d'un badge de filtre
  const renderFilterBadge = (filter) => {
    const isActive = activeValues[filter.id] !== undefined;
    
    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterBadge,
          isActive && styles.activeFilterBadge
        ]}
        onPress={() => openFilterModal(filter)}
      >
        {filter.icon && (
          <Ionicons
            name={filter.icon}
            size={16}
            color={isActive ? theme.colors.white : theme.colors.primary}
            style={styles.filterIcon}
          />
        )}
        <Text
          style={[
            styles.filterBadgeText,
            isActive && styles.activeFilterBadgeText
          ]}
          numberOfLines={1}
        >
          {isActive && filter.getActiveLabel 
            ? filter.getActiveLabel(activeValues[filter.id]) 
            : filter.label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Rendu du contenu du modal selon le type de filtre
  const renderFilterModalContent = (filter) => {
    const currentValue = activeValues[filter.id];
    
    switch (filter.type) {
      case 'select':
        return (
          <FlatList
            data={filter.options}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  currentValue === item.value && styles.selectedOption
                ]}
                onPress={() => applyFilter(filter.id, item.value)}
              >
                <Text style={[
                  styles.selectOptionText,
                  currentValue === item.value && styles.selectedOptionText
                ]}>
                  {item.label}
                </Text>
                {currentValue === item.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        );
      
      case 'date':
        return (
          <View style={styles.datePickerContainer}>
            <DatePicker
              value={currentValue}
              onChange={(date) => applyFilter(filter.id, date)}
              minDate={filter.minDate}
              maxDate={filter.maxDate}
            />
          </View>
        );
      
      case 'dateRange':
        const startDate = currentValue ? currentValue.startDate : null;
        const endDate = currentValue ? currentValue.endDate : null;
        
        return (
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeLabel}>Date de début</Text>
            <DatePicker
              value={startDate}
              onChange={(date) => {
                const newRange = { 
                  startDate: date, 
                  endDate: endDate 
                };
                handleFilterChange(filter.id, newRange);
              }}
              minDate={filter.minDate}
              maxDate={endDate || filter.maxDate}
            />
            
            <Text style={[styles.dateRangeLabel, { marginTop: 16 }]}>Date de fin</Text>
            <DatePicker
              value={endDate}
              onChange={(date) => {
                const newRange = { 
                  startDate: startDate, 
                  endDate: date 
                };
                handleFilterChange(filter.id, newRange);
              }}
              minDate={startDate || filter.minDate}
              maxDate={filter.maxDate}
            />
            
            <View style={styles.dateRangeActions}>
              <TouchableOpacity
                style={[styles.dateRangeButton, styles.dateRangeCancelButton]}
                onPress={() => setActiveFilterModal(null)}
              >
                <Text style={styles.dateRangeCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateRangeButton, styles.dateRangeApplyButton]}
                onPress={() => setActiveFilterModal(null)}
              >
                <Text style={styles.dateRangeApplyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'range':
        const minValue = currentValue ? currentValue.min : '';
        const maxValue = currentValue ? currentValue.max : '';
        
        return (
          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>Valeur minimum</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.rangeInput}
                value={minValue.toString()}
                onChangeText={(text) => {
                  const newRange = { 
                    ...currentValue, 
                    min: text 
                  };
                  handleFilterChange(filter.id, newRange);
                }}
                keyboardType="numeric"
                placeholder="Min"
              />
            </View>
            
            <Text style={[styles.rangeLabel, { marginTop: 16 }]}>Valeur maximum</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.rangeInput}
                value={maxValue.toString()}
                onChangeText={(text) => {
                  const newRange = { 
                    ...currentValue, 
                    max: text 
                  };
                  handleFilterChange(filter.id, newRange);
                }}
                keyboardType="numeric"
                placeholder="Max"
              />
            </View>
            
            <View style={styles.rangeActions}>
              <TouchableOpacity
                style={[styles.rangeButton, styles.rangeCancelButton]}
                onPress={() => setActiveFilterModal(null)}
              >
                <Text style={styles.rangeCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.rangeButton, styles.rangeApplyButton]}
                onPress={() => setActiveFilterModal(null)}
              >
                <Text style={styles.rangeApplyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  // Compter le nombre de filtres actifs
  const activeFiltersCount = Object.keys(activeValues).length;
  
  return (
    <View style={[styles.container, style]}>
      {/* Barre de recherche */}
      {searchEnabled && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearchChange}
            clearButtonMode="while-editing"
          />
        </View>
      )}
      
      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={maxHeight ? { maxHeight } : {}}
        >
          {visibleFilters.map(renderFilterBadge)}
          
          {hasMoreFilters && (
            <TouchableOpacity
              style={styles.moreFiltersButton}
              onPress={() => setShowAllFilters(!showAllFilters)}
            >
              <Text style={styles.moreFiltersText}>
                {showAllFilters ? 'Moins de filtres' : `Plus de filtres (${filters.length - maxDisplayedFilters})`}
              </Text>
              <Ionicons
                name={showAllFilters ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
          
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Réinitialiser tous les filtres</Text>
              <Ionicons name="close-circle" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
      
      {/* Pastilles des filtres actifs */}
      {activeFiltersCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFiltersContainer}
        >
          {Object.entries(activeValues).map(([filterId, value]) => {
            const filter = filters.find(f => f.id === filterId);
            if (!filter) return null;
            
            return (
              <View key={filterId} style={styles.activeFilter}>
                <Text style={styles.activeFilterText} numberOfLines={1}>
                  {filter.label}: {filter.getActiveLabel ? filter.getActiveLabel(value) : value.toString()}
                </Text>
                <TouchableOpacity
                  style={styles.removeFilterButton}
                  onPress={() => removeFilter(filterId)}
                >
                  <Ionicons name="close-circle" size={16} color={theme.colors.gray} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
      
      {/* Modal de filtre */}
      <Modal
        visible={activeFilterModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActiveFilterModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setActiveFilterModal(null)}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>
                {activeFilterModal?.label || 'Filtre'}
              </Text>
              
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.modalBody}>
              {activeFilterModal && renderFilterModalContent(activeFilterModal)}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
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
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    ...theme.shadows.small,
  },
  activeFilterBadge: {
    backgroundColor: theme.colors.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterBadgeText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activeFilterBadgeText: {
    color: theme.colors.white,
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    ...theme.shadows.small,
  },
  moreFiltersText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}20`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetButtonText: {
    fontSize: 14,
    color: theme.colors.error,
    marginRight: 4,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    color: theme.colors.text,
    maxWidth: 150,
  },
  removeFilterButton: {
    marginLeft: 4,
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalBody: {
    padding: 16,
  },
  
  // Styles pour l'option Select
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  selectedOption: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  selectOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedOptionText: {
    fontWeight: '500',
    color: theme.colors.primary,
  },
  
  // Styles pour le DatePicker
  datePickerContainer: {
    padding: 16,
  },
  
  // Styles pour le DateRange
  dateRangeContainer: {
    padding: 16,
  },
  dateRangeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  dateRangeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  dateRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  dateRangeCancelButton: {
    backgroundColor: theme.colors.lightGray,
  },
  dateRangeApplyButton: {
    backgroundColor: theme.colors.primary,
  },
  dateRangeCancelButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  dateRangeApplyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white,
  },
  
  // Styles pour le Range
  rangeContainer: {
    padding: 16,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 8,
    backgroundColor: theme.colors.lightGray,
    overflow: 'hidden',
  },
  rangeInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rangeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  rangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  rangeCancelButton: {
    backgroundColor: theme.colors.lightGray,
  },
  rangeApplyButton: {
    backgroundColor: theme.colors.primary,
  },
  rangeCancelButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  rangeApplyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white,
  },
});

export default FilterBar;