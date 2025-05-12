// src/components/SelectInput/SelectInput.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const SelectInput = ({
  label,
  placeholder = 'Sélectionner une option',
  value,
  options = [],
  onChange,
  error,
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  valueKey = 'value',
  labelKey = 'label',
  required = false,
  disabled = false,
  style,
  modalTitle = 'Sélectionner une option',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trouver l'option correspondant à la valeur actuelle
  const selectedOption = options.find(option => {
    if (typeof option === 'object') {
      return option[valueKey] === value;
    }
    return option === value;
  });
  
  // Texte à afficher dans le select
  const displayText = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption[labelKey] : selectedOption)
    : placeholder;
  
  // Ouvrir le modal
  const openModal = () => {
    if (!disabled) {
      setModalVisible(true);
    }
  };
  
  // Fermer le modal
  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };
  
  // Sélectionner une option
  const handleSelect = (option) => {
    onChange(typeof option === 'object' ? option[valueKey] : option);
    closeModal();
  };
  
  // Filtrer les options en fonction de la recherche
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => {
        const optionLabel = typeof option === 'object' ? option[labelKey] : option;
        return optionLabel.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;
  
  // Rendu d'un élément de la liste des options
  const renderOption = ({ item }) => {
    const optionLabel = typeof item === 'object' ? item[labelKey] : item;
    const optionValue = typeof item === 'object' ? item[valueKey] : item;
    const isSelected = optionValue === value;
    
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => handleSelect(item)}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {optionLabel}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.selectContainer,
          error && styles.errorContainer,
          disabled && styles.disabledContainer,
        ]}
        onPress={openModal}
        disabled={disabled}
      >
        <Text 
          style={[
            styles.selectText,
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <View style={styles.closeButtonPlaceholder} />
            </View>
            
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={false}
                  clearButtonMode="while-editing"
                />
              </View>
            )}
            
            <FlatList
              data={filteredOptions}
              renderItem={renderOption}
              keyExtractor={(item, index) => 
                typeof item === 'object' 
                  ? (item[valueKey]?.toString() || index.toString())
                  : item.toString()
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Aucun résultat trouvé' : 'Aucune option disponible'}
                  </Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  requiredAsterisk: {
    color: theme.colors.error,
    marginLeft: 2,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: theme.colors.lightGray,
  },
  errorContainer: {
    borderColor: theme.colors.error,
  },
  disabledContainer: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.7,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.gray,
  },
  disabledText: {
    color: theme.colors.textLight,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonPlaceholder: {
    width: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  selectedOption: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedOptionText: {
    fontWeight: '500',
    color: theme.colors.primary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default SelectInput;