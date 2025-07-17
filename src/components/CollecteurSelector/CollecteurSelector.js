// src/components/CollecteurSelector/CollecteurSelector.js - VERSION CORRIGÉE
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

/**
 * Composant CollecteurSelector basé sur les patterns existants du projet
 */
const CollecteurSelector = ({
  collecteurs = [],
  selectedCollecteur,
  onSelectCollecteur,
  placeholder = "Sélectionner un collecteur",
  disabled = false,
  style,
}) => {
  const [showModal, setShowModal] = useState(false);

  // ✅ Pattern identique à OptimizedClientList
  const keyExtractor = useCallback((item) => item?.id?.toString() || Math.random().toString(), []);

  // ✅ Pattern identique aux autres composants du projet
  const renderCollecteurItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.collecteurItem}
      onPress={() => handleSelectCollecteur(item)}
    >
      <View style={styles.collecteurInfo}>
        <Text style={styles.collecteurName}>
          {item.prenom} {item.nom}
        </Text>
        <Text style={styles.collecteurDetails}>
          📧 {item.adresseMail}
        </Text>
        <Text style={styles.collecteurDetails}>
          📞 {item.telephone}
        </Text>
        <View style={styles.collecteurMeta}>
          <Text style={styles.collecteurId}>ID: {item.id}</Text>
          <View style={[
            styles.statusBadge,
            item.active ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.active ? theme.colors.success : theme.colors.error }
            ]}>
              {item.active ? 'ACTIF' : 'INACTIF'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={theme.colors.textLight} 
      />
    </TouchableOpacity>
  ), []);

  const handleSelectCollecteur = useCallback((collecteur) => {
    console.log('✅ Collecteur sélectionné:', collecteur);
    onSelectCollecteur(collecteur);
    setShowModal(false);
  }, [onSelectCollecteur]);

  const getDisplayText = () => {
    if (selectedCollecteur) {
      return `${selectedCollecteur.prenom} ${selectedCollecteur.nom}`;
    }
    return placeholder;
  };

  // ✅ Pattern identique à SelectInput du projet
  const openModal = () => {
    if (!disabled) {
      console.log('🔄 Ouverture modal collecteurs, nb:', collecteurs.length);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Sélecteur principal */}
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
          style
        ]}
        onPress={openModal}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Text style={[
            styles.selectorText,
            !selectedCollecteur && styles.placeholderText
          ]}>
            {getDisplayText()}
          </Text>
          
          {selectedCollecteur && (
            <Text style={styles.selectedDetails}>
              ID: {selectedCollecteur.id} • {selectedCollecteur.adresseMail}
            </Text>
          )}
        </View>
        
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? theme.colors.textLight : theme.colors.primary} 
        />
      </TouchableOpacity>

      {/* Informations de debug */}
      <Text style={styles.debugInfo}>
        {collecteurs.length} collecteur(s) disponible(s)
      </Text>

      {/* Modal de sélection - Pattern identique à SelectInput */}
      <Modal
        visible={showModal}
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
              <Text style={styles.modalTitle}>Sélectionner un collecteur</Text>
              <View style={styles.closeButtonPlaceholder} />
            </View>

            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                {collecteurs.length} collecteur(s) trouvé(s)
              </Text>
            </View>

            {collecteurs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="people-outline" 
                  size={64} 
                  color={theme.colors.textLight} 
                />
                <Text style={styles.emptyText}>
                  Aucun collecteur disponible
                </Text>
              </View>
            ) : (
              <FlatList
                data={collecteurs}
                renderItem={renderCollecteurItem}
                keyExtractor={keyExtractor}
                style={styles.collecteursList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectorDisabled: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.6,
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    color: theme.colors.textLight,
    fontWeight: 'normal',
  },
  selectedDetails: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  debugInfo: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: theme.colors.white,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  countContainer: {
    padding: 16,
    backgroundColor: theme.colors.lightGray + '50',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  countText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  collecteursList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  collecteurItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  collecteurDetails: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  collecteurMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  collecteurId: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  activeBadge: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success + '40',
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error + '40',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default CollecteurSelector;