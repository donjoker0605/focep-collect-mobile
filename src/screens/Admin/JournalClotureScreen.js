// src/screens/Admin/JournalClotureScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SelectInput from '../../components/SelectInput/SelectInput';
import theme from '../../theme';

// Hooks et services
import { useAdminCollecteurs } from '../../hooks/useAdminCollecteurs';
import { journalService } from '../../services';

const JournalClotureScreen = ({ navigation }) => {
  // États
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journalData, setJournalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cloturing, setCloturing] = useState(false);
  const [error, setError] = useState(null);

  // Hook pour les collecteurs
  const { 
    collecteurs, 
    loading: collecteursLoading, 
    fetchCollecteurs, 
    refreshCollecteurs 
  } = useAdminCollecteurs();

  // Charger les collecteurs au démarrage
  useEffect(() => {
    fetchCollecteurs();
  }, []);

  // Options pour les collecteurs
  const collecteurOptions = collecteurs.map(collecteur => ({
    label: `${collecteur.prenom} ${collecteur.nom}`,
    value: collecteur.id,
    data: collecteur
  }));

  // Options pour les dates (derniers 30 jours)
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      label: format(date, 'dd/MM/yyyy', { locale: fr }),
      value: format(date, 'yyyy-MM-dd')
    };
  });

  // Charger les données du journal
  const loadJournalData = async (collecteurId, date) => {
    if (!collecteurId || !date) return;

    try {
      setLoading(true);
      setError(null);

      const response = await journalService.getJournalDuJour(collecteurId, date);
      
      if (response.success) {
        setJournalData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement du journal');
      }
    } catch (err) {
      console.error('Erreur chargement journal:', err);
      setError(err.message || 'Erreur lors du chargement du journal');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de collecteur
  const handleCollecteurChange = (collecteurId) => {
    setSelectedCollecteur(collecteurId);
    setJournalData(null);
    if (collecteurId && selectedDate) {
      loadJournalData(collecteurId, selectedDate);
    }
  };

  // Gérer le changement de date
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setJournalData(null);
    if (selectedCollecteur && date) {
      loadJournalData(selectedCollecteur, date);
    }
  };

  // Clôturer le journal
  const handleClotureJournal = () => {
    if (!selectedCollecteur || !selectedDate || !journalData) return;

    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir clôturer le journal du ${format(new Date(selectedDate), 'dd/MM/yyyy')} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Clôturer', onPress: executeClotureJournal }
      ]
    );
  };

  // Exécuter la clôture
  const executeClotureJournal = async () => {
    try {
      setCloturing(true);
      setError(null);

      const response = await journalService.cloturerJournalDuJour(
        selectedCollecteur, 
        selectedDate
      );

      if (response.success) {
        // Recharger les données
        await loadJournalData(selectedCollecteur, selectedDate);
        
        Alert.alert(
          'Succès',
          'Le journal a été clôturé avec succès.',
          [{ text: 'OK' }]
        );
      } else {
        setError(response.error || 'Erreur lors de la clôture du journal');
      }
    } catch (err) {
      console.error('Erreur clôture journal:', err);
      setError(err.message || 'Erreur lors de la clôture du journal');
    } finally {
      setCloturing(false);
    }
  };

  // Formater la devise
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  };

  // Rendu d'une opération
  const renderOperation = ({ item }) => (
    <View style={styles.operationItem}>
      <View style={styles.operationInfo}>
        <Text style={styles.operationClient}>
          {item.clientNom} {item.clientPrenom}
        </Text>
        <Text style={styles.operationType}>{item.typeMouvement}</Text>
        <Text style={styles.operationDate}>
          {format(new Date(item.dateOperation), 'HH:mm')}
        </Text>
      </View>
      <View style={styles.operationAmount}>
        <Text style={[
          styles.operationValue,
          { color: item.sens === 'epargne' ? theme.colors.success : theme.colors.error }
        ]}>
          {item.sens === 'retrait' ? '-' : '+'}{formatCurrency(item.montant)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Clôture des journées"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Formulaire de sélection */}
        <Card style={styles.selectionCard}>
          <Text style={styles.cardTitle}>Sélection</Text>
          
          <SelectInput
            label="Collecteur"
            placeholder="Sélectionner un collecteur"
            value={selectedCollecteur}
            options={collecteurOptions}
            onChange={handleCollecteurChange}
            disabled={collecteursLoading}
            required
          />

          <SelectInput
            label="Date"
            placeholder="Sélectionner une date"
            value={selectedDate}
            options={dateOptions}
            onChange={handleDateChange}
            required
          />

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Card>

        {/* Données du journal */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement du journal...</Text>
          </View>
        ) : journalData ? (
          <View style={styles.journalContainer}>
            {/* Résumé du journal */}
            <Card style={styles.summaryCard}>
              <Text style={styles.cardTitle}>
                Résumé du {format(new Date(selectedDate), 'dd/MM/yyyy')}
              </Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Statut:</Text>
                <View style={[
                  styles.statusBadge,
                  journalData.estCloture ? styles.closedBadge : styles.openBadge
                ]}>
                  <Text style={styles.statusText}>
                    {journalData.estCloture ? 'Clôturé' : 'Ouvert'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nombre d'opérations:</Text>
                <Text style={styles.summaryValue}>{journalData.nombreOperations}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Référence:</Text>
                <Text style={styles.summaryValue}>{journalData.reference}</Text>
              </View>
            </Card>

            {/* Liste des opérations */}
            <Card style={styles.operationsCard}>
              <Text style={styles.cardTitle}>
                Opérations ({journalData.operations?.length || 0})
              </Text>

              {journalData.operations && journalData.operations.length > 0 ? (
                <FlatList
                  data={journalData.operations}
                  renderItem={renderOperation}
                  keyExtractor={item => item.id.toString()}
                  style={styles.operationsList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Text style={styles.noOperationsText}>
                  Aucune opération enregistrée pour cette journée
                </Text>
              )}
            </Card>

            {/* Bouton de clôture */}
            {!journalData.estCloture && (
              <Button
                title="Clôturer cette journée"
                onPress={handleClotureJournal}
                loading={cloturing}
                disabled={cloturing || !journalData.operations?.length}
                style={styles.clotureButton}
              />
            )}
          </View>
        ) : selectedCollecteur && selectedDate ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-outline" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyText}>
              Aucun journal trouvé pour cette date
            </Text>
          </Card>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },
  selectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  journalContainer: {
    flex: 1,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  closedBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  openBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  operationsCard: {
    flex: 1,
    padding: 16,
    marginBottom: 16,
  },
  operationsList: {
    flex: 1,
  },
  operationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  operationInfo: {
    flex: 1,
  },
  operationClient: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  operationType: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  operationDate: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  operationAmount: {
    alignItems: 'flex-end',
  },
  operationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noOperationsText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 16,
    paddingVertical: 32,
  },
  emptyCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  clotureButton: {
    marginTop: 16,
  },
});

export default JournalClotureScreen;