// src/screens/Admin/RubriqueRemunerationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import CollecteurSelector from '../../components/CollecteurSelector/CollecteurSelector';
import StatsCard from '../../components/StatsCard/StatsCard';
import Modal from '../../components/Modal/Modal';
import RubriqueRemunerationForm from '../../components/RubriqueRemuneration/RubriqueRemunerationForm';

import { useCommissionV2 } from '../../hooks/useCommissionV2';
import { useCollecteurs } from '../../hooks/useCollecteurs';
import colors from '../../theme/colors';
import { formatters } from '../../utils/formatters';

export default function RubriqueRemunerationScreen({ navigation }) {
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRubrique, setSelectedRubrique] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    loading,
    error,
    rubriques,
    loadRubriques,
    createRubrique,
    updateRubrique,
    deactivateRubrique,
    clearError
  } = useCommissionV2();

  const { collecteurs, loading: collecteursLoading } = useCollecteurs();

  useEffect(() => {
    if (selectedCollecteur) {
      loadRubriques(selectedCollecteur.id);
    }
  }, [selectedCollecteur]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  const handleRefresh = async () => {
    if (!selectedCollecteur) return;
    
    setRefreshing(true);
    await loadRubriques(selectedCollecteur.id);
    setRefreshing(false);
  };

  const handleCreateRubrique = () => {
    if (!selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner un collecteur');
      return;
    }
    setSelectedRubrique(null);
    setShowForm(true);
  };

  const handleEditRubrique = (rubrique) => {
    setSelectedRubrique(rubrique);
    setShowForm(true);
  };

  const handleDeleteRubrique = (rubrique) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir désactiver la rubrique "${rubrique.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deactivateRubrique(rubrique.id);
            if (result.success) {
              Alert.alert('Succès', 'Rubrique désactivée avec succès');
            }
          }
        }
      ]
    );
  };

  const handleSubmitForm = async (formData) => {
    try {
      let result;
      
      if (selectedRubrique) {
        result = await updateRubrique(selectedRubrique.id, formData);
      } else {
        result = await createRubrique(formData);
      }

      if (result.success) {
        setShowForm(false);
        Alert.alert('Succès', result.message);
        // Recharger les rubriques
        loadRubriques(selectedCollecteur.id);
      }
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  };

  const getRubriqueStats = () => {
    if (!rubriques || rubriques.length === 0) return null;

    const activeRubriques = rubriques.filter(r => r.active);
    const totalConstant = activeRubriques
      .filter(r => r.type === 'CONSTANT')
      .reduce((sum, r) => sum + r.valeur, 0);
    const totalPercentage = activeRubriques
      .filter(r => r.type === 'PERCENTAGE')
      .reduce((sum, r) => sum + r.valeur, 0);

    return {
      total: rubriques.length,
      active: activeRubriques.length,
      totalConstant,
      totalPercentage
    };
  };

  const stats = getRubriqueStats();

  const renderRubriqueCard = (rubrique) => (
    <Card key={rubrique.id} style={styles.rubriqueCard}>
      <View style={styles.rubriqueHeader}>
        <View style={styles.rubriqueInfo}>
          <Text style={styles.rubriqueName}>{rubrique.nom}</Text>
          <Text style={styles.rubriqueType}>
            {rubrique.type === 'CONSTANT' ? 'Montant Fixe' : 'Pourcentage'}
          </Text>
        </View>
        <View style={styles.rubriqueValue}>
          <Text style={styles.valueText}>
            {rubrique.type === 'CONSTANT' 
              ? formatters.formatMoney(rubrique.valeur)
              : `${rubrique.valeur}%`
            }
          </Text>
        </View>
        <View style={styles.rubriqueActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditRubrique(rubrique)}
          >
            <Icon name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRubrique(rubrique)}
          >
            <Icon name="delete" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rubriqueDetails}>
        <View style={styles.detailItem}>
          <Icon name="today" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            Appliquée le {formatters.formatDate(rubrique.dateApplication)}
          </Text>
        </View>
        
        {rubrique.delaiJours && (
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Durée: {rubrique.delaiJours} jours
            </Text>
          </View>
        )}

        <View style={styles.detailItem}>
          <Icon name="group" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {rubrique.collecteurIds?.length || 0} collecteur(s)
          </Text>
        </View>

        <View style={[styles.statusBadge, rubrique.active ? styles.activeStatus : styles.inactiveStatus]}>
          <Text style={[styles.statusText, rubrique.active ? styles.activeStatusText : styles.inactiveStatusText]}>
            {rubrique.active ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Rubriques de Rémunération</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleCreateRubrique}
          >
            <Icon name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Sélection collecteur */}
        <Card style={styles.selectorCard}>
          <Text style={styles.sectionTitle}>Collecteur</Text>
          <CollecteurSelector
            collecteurs={collecteurs}
            selectedCollecteur={selectedCollecteur}
            onSelectCollecteur={setSelectedCollecteur}
            loading={collecteursLoading}
          />
        </Card>

        {/* Statistiques */}
        {stats && selectedCollecteur && (
          <View style={styles.statsRow}>
            <StatsCard
              title="Total"
              value={stats.total.toString()}
              icon="list"
              color={colors.info}
              style={styles.statCard}
            />
            <StatsCard
              title="Actives"
              value={stats.active.toString()}
              icon="checkmark-circle-outline"
              color={colors.success}
              style={styles.statCard}
            />
            <StatsCard
              title="Montants"
              value={formatters.formatMoney(stats.totalConstant)}
              icon="cash"
              color={colors.warning}
              style={styles.statCard}
            />
          </View>
        )}

        {/* Liste des rubriques */}
        {selectedCollecteur && (
          <Card style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>
                Rubriques ({rubriques.length})
              </Text>
              <Button
                title="Nouvelle Rubrique"
                onPress={handleCreateRubrique}
                variant="primary"
                style={styles.addRubriqueButton}
                icon="add"
                size="small"
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : rubriques.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Aucune rubrique configurée</Text>
                <Button
                  title="Créer la première rubrique"
                  onPress={handleCreateRubrique}
                  variant="secondary"
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              <View style={styles.rubriquesList}>
                {rubriques.map(renderRubriqueCard)}
              </View>
            )}
          </Card>
        )}

        {/* Message si aucun collecteur sélectionné */}
        {!selectedCollecteur && (
          <Card style={styles.placeholderCard}>
            <Icon name="person-pin" size={64} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>
              Sélectionnez un collecteur pour gérer ses rubriques de rémunération
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Modal formulaire */}
      <Modal
        isVisible={showForm}
        onClose={() => setShowForm(false)}
        title={selectedRubrique ? 'Modifier Rubrique' : 'Nouvelle Rubrique'}
      >
        <RubriqueRemunerationForm
          rubrique={selectedRubrique}
          collecteurs={selectedCollecteur ? [selectedCollecteur] : []}
          onSubmit={handleSubmitForm}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1
  },
  addButton: {
    padding: 8
  },
  selectorCard: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    flex: 0.32
  },
  listCard: {
    marginBottom: 16
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  addRubriqueButton: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center'
  },
  loadingText: {
    color: colors.textSecondary
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16
  },
  emptyButton: {
    marginTop: 8
  },
  rubriquesList: {
    gap: 12
  },
  rubriqueCard: {
    padding: 16,
    marginBottom: 8
  },
  rubriqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  rubriqueInfo: {
    flex: 1
  },
  rubriqueName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  rubriqueType: {
    fontSize: 12,
    color: colors.textSecondary
  },
  rubriqueValue: {
    marginRight: 12
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary
  },
  rubriqueActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    padding: 8,
    borderRadius: 6
  },
  editButton: {
    backgroundColor: colors.primary + '20'
  },
  deleteButton: {
    backgroundColor: colors.error + '20'
  },
  rubriqueDetails: {
    gap: 8
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  activeStatus: {
    backgroundColor: colors.success + '20'
  },
  inactiveStatus: {
    backgroundColor: colors.error + '20'
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  activeStatusText: {
    color: colors.success
  },
  inactiveStatusText: {
    color: colors.error
  },
  placeholderCard: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24
  }
});