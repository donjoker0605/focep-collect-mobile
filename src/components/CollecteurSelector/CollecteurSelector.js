// src/components/CollecteurSelector/CollecteurSelector.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

/**
 * Composant CollecteurSelector pour sélectionner un collecteur dans une liste
 * 
 * @param {Array} collecteurs - Liste des collecteurs disponibles
 * @param {Object} selectedCollecteur - Collecteur actuellement sélectionné
 * @param {Function} onSelectCollecteur - Fonction appelée lors de la sélection
 * @param {string} placeholder - Texte de placeholder
 * @param {boolean} disabled - Si le composant est désactivé
 * @param {Object} style - Styles supplémentaires
 */
const CollecteurSelector = ({
  collecteurs = [],
  selectedCollecteur,
  onSelectCollecteur,
  placeholder = "Sélectionner un collecteur",
  disabled = false,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectCollecteur = (collecteur) => {
    onSelectCollecteur(collecteur);
    setModalVisible(false);
  };

  const renderCollecteurItem = ({ item }) => (
    <TouchableOpacity
      style={styles.collecteurItem}
      onPress={() => handleSelectCollecteur(item)}
    >
      <View style={styles.collecteurInfo}>
        <Text style={styles.collecteurName}>
          {item.prenom} {item.nom}
        </Text>
        {item.code && (
          <Text style={styles.collecteurCode}>Code: {item.code}</Text>
        )}
        {item.telephone && (
          <Text style={styles.collecteurPhone}>📞 {item.telephone}</Text>
        )}
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={theme.colors.textLight} 
      />
    </TouchableOpacity>
  );

  const getDisplayText = () => {
    if (selectedCollecteur) {
      return `${selectedCollecteur.prenom} ${selectedCollecteur.nom}`;
    }
    return placeholder;
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
          style
        ]}
        onPress={() => !disabled && setModalVisible(true)}
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
            <View style={styles.selectedInfo}>
              {selectedCollecteur.code && (
                <Text style={styles.selectedCode}>
                  Code: {selectedCollecteur.code}
                </Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.selectorIcon}>
          {disabled ? (
            <ActivityIndicator size="small" color={theme.colors.textLight} />
          ) : (
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={theme.colors.textLight} 
            />
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un collecteur</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {collecteurs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="people-outline" 
                  size={48} 
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
                keyExtractor={(item) => item.id?.toString() || item.code}
                style={styles.collecteursList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    minHeight: 48,
  },
  selectorDisabled: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.6,
  },
  selectorContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.textLight,
  },
  selectedInfo: {
    marginTop: 4,
  },
  selectedCode: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  selectorIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  collecteursList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  collecteurItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  collecteurCode: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  collecteurPhone: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default CollecteurSelector;