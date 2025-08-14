// src/screens/SuperAdmin/CommissionManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import superAdminService from '../../services/superAdminService';

const CommissionManagementScreen = ({ navigation }) => {
  const {
    loading,
    error,
    agences,
    loadAgences,
    clearError
  } = useSuperAdmin();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [parametresCommission, setParametresCommission] = useState([]);
  const [loadingParametres, setLoadingParametres] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParametre, setEditingParametre] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    typeOperation: '',
    pourcentageCommission: '',
    montantFixe: '',
    montantMinimum: '',
    montantMaximum: '',
    actif: true,
  });

  const typesOperation = [
    { value: 'DEPOT', label: 'Dépôt' },
    { value: 'RETRAIT', label: 'Retrait' },
    { value: 'TRANSFERT', label: 'Transfert' },
    { value: 'PAIEMENT', label: 'Paiement' },
    { value: 'CONSULTATION_SOLDE', label: 'Consultation de solde' },
  ];

  useEffect(() => {
    loadAgences();
  }, []);

  useEffect(() => {
    if (selectedAgence) {
      loadParametresCommission();
    }
  }, [selectedAgence]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgences();
    if (selectedAgence) {
      await loadParametresCommission();
    }
    setRefreshing(false);
  };

  const loadParametresCommission = async () => {
    if (!selectedAgence) return;

    setLoadingParametres(true);
    try {
      const result = await superAdminService.getParametresCommissionByAgence(selectedAgence.id);
      if (result.success) {
        setParametresCommission(result.data || []);
      } else {
        console.error('Erreur lors du chargement des paramètres:', result.error);
        setParametresCommission([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setParametresCommission([]);
    } finally {
      setLoadingParametres(false);
    }
  };

  const handleAgenceSelect = (agence) => {
    setSelectedAgence(agence);
    setParametresCommission([]);
  };

  const handleAddParametre = () => {
    setEditingParametre(null);
    setFormData({
      typeOperation: '',
      pourcentageCommission: '',
      montantFixe: '',
      montantMinimum: '',
      montantMaximum: '',
      actif: true,
    });
    setModalVisible(true);
  };

  const handleEditParametre = (parametre) => {
    setEditingParametre(parametre);
    setFormData({
      typeOperation: parametre.typeOperation,
      pourcentageCommission: parametre.pourcentageCommission?.toString() || '',
      montantFixe: parametre.montantFixe?.toString() || '',
      montantMinimum: parametre.montantMinimum?.toString() || '',
      montantMaximum: parametre.montantMaximum?.toString() || '',
      actif: parametre.actif,
    });
    setModalVisible(true);
  };

  const handleSaveParametre = async () => {
    // Validation
    if (!formData.typeOperation) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'opération');
      return;
    }

    if (!formData.pourcentageCommission && !formData.montantFixe) {
      Alert.alert('Erreur', 'Veuillez définir au moins un pourcentage ou un montant fixe');
      return;
    }

    try {
      const parametreData = {
        agenceId: selectedAgence.id,
        typeOperation: formData.typeOperation,
        pourcentageCommission: formData.pourcentageCommission ? parseFloat(formData.pourcentageCommission) : null,
        montantFixe: formData.montantFixe ? parseFloat(formData.montantFixe) : null,
        montantMinimum: formData.montantMinimum ? parseFloat(formData.montantMinimum) : null,
        montantMaximum: formData.montantMaximum ? parseFloat(formData.montantMaximum) : null,
        actif: formData.actif,
      };

      let result;
      if (editingParametre) {
        result = await superAdminService.updateParametreCommission(editingParametre.id, parametreData);
      } else {
        result = await superAdminService.createParametreCommission(parametreData);
      }

      if (result.success) {
        Alert.alert(
          'Succès',
          result.message || (editingParametre ? 'Paramètre mis à jour avec succès' : 'Paramètre créé avec succès'),
          [
            {
              text: 'OK',
              onPress: () => {
                setModalVisible(false);
                loadParametresCommission();
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleDeleteParametre = (parametre) => {
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer le paramètre pour ${parametre.typeOperationDisplay} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await superAdminService.deleteParametreCommission(parametre.id);
              if (result.success) {
                setParametresCommission(prev =>
                  prev.filter(p => p.id !== parametre.id)
                );
                Alert.alert('Succès', result.message || 'Paramètre supprimé avec succès');
              } else {
                Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const formatMontant = (montant) => {
    return montant ? `${montant} FCFA` : '-';
  };

  const renderAgenceItem = (agence) => (
    <TouchableOpacity
      key={agence.id}
      style={[
        styles.agenceItem,
        selectedAgence?.id === agence.id && styles.selectedAgenceItem
      ]}
      onPress={() => handleAgenceSelect(agence)}
    >
      <View style={styles.agenceInfo}>
        <Text style={styles.agenceName}>{agence.nomAgence}</Text>
        <Text style={styles.agenceCode}>{agence.codeAgence}</Text>
      </View>
      <View style={[
        styles.statusBadge,
        agence.active ? styles.activeBadge : styles.inactiveBadge
      ]}>
        <Text style={styles.statusText}>
          {agence.active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderParametreItem = (parametre) => (
    <Card key={parametre.id} style={styles.parametreCard}>
      <View style={styles.parametreHeader}>
        <View style={styles.parametreInfo}>
          <Text style={styles.parametreType}>{parametre.typeOperationDisplay}</Text>
          <View style={[
            styles.statusBadge,
            parametre.actif ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {parametre.actif ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
        <View style={styles.parametreActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditParametre(parametre)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteParametre(parametre)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.parametreDetails}>
        {parametre.pourcentageCommission && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pourcentage:</Text>
            <Text style={styles.detailValue}>{parametre.pourcentageCommission}%</Text>
          </View>
        )}
        {parametre.montantFixe && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Montant fixe:</Text>
            <Text style={styles.detailValue}>{formatMontant(parametre.montantFixe)}</Text>
          </View>
        )}
        {parametre.montantMinimum && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Minimum:</Text>
            <Text style={styles.detailValue}>{formatMontant(parametre.montantMinimum)}</Text>
          </View>
        )}
        {parametre.montantMaximum && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Maximum:</Text>
            <Text style={styles.detailValue}>{formatMontant(parametre.montantMaximum)}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  if (loading && !agences.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Gestion des Commissions"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des Commissions"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Sélection d'agence */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sélectionner une agence</Text>
          <View style={styles.agencesList}>
            {agences.map(renderAgenceItem)}
          </View>
        </Card>

        {/* Paramètres de commission */}
        {selectedAgence && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Paramètres de commission - {selectedAgence.nomAgence}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddParametre}
              >
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {loadingParametres ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement des paramètres...</Text>
              </View>
            ) : parametresCommission.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="settings-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  Aucun paramètre de commission configuré pour cette agence
                </Text>
              </View>
            ) : (
              <View style={styles.parametresList}>
                {parametresCommission.map(renderParametreItem)}
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Modal de création/édition */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingParametre ? 'Modifier le paramètre' : 'Nouveau paramètre'}
            </Text>
            <TouchableOpacity onPress={handleSaveParametre}>
              <Text style={styles.saveButton}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type d'opération *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.typeOperation}
                  onValueChange={(value) => setFormData({...formData, typeOperation: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionner un type" value="" />
                  {typesOperation.map(type => (
                    <Picker.Item
                      key={type.value}
                      label={type.label}
                      value={type.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pourcentage de commission (%)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.pourcentageCommission}
                onChangeText={(text) => setFormData({...formData, pourcentageCommission: text})}
                placeholder="Ex: 2.5"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Montant fixe (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.montantFixe}
                onChangeText={(text) => setFormData({...formData, montantFixe: text})}
                placeholder="Ex: 100"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Montant minimum (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.montantMinimum}
                onChangeText={(text) => setFormData({...formData, montantMinimum: text})}
                placeholder="Ex: 50"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Montant maximum (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.montantMaximum}
                onChangeText={(text) => setFormData({...formData, montantMaximum: text})}
                placeholder="Ex: 1000"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorCard: {
    backgroundColor: theme.colors.errorLight,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.error,
    fontSize: 14,
  },
  errorButton: {
    padding: 8,
  },
  errorButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  agencesList: {
    gap: 8,
  },
  agenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedAgenceItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  agenceInfo: {
    flex: 1,
  },
  agenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  agenceCode: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    color: theme.colors.white,
  },
  parametresList: {
    gap: 12,
  },
  parametreCard: {
    padding: 16,
  },
  parametreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parametreInfo: {
    flex: 1,
  },
  parametreType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  parametreActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: theme.colors.errorLight,
  },
  parametreDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
});

export default CommissionManagementScreen;