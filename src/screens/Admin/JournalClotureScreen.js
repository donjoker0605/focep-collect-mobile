// src/screens/Admin/JournalClotureScreen.js - VERSION COMPLÈTE
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
  ScrollView,
  TextInput,
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

const JournalClotureScreen = ({ navigation }) => {
  // États
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [montantVerse, setMontantVerse] = useState('');
  const [commentaire, setCommentaire] = useState('');
  
  // États pour les données
  const [previewData, setPreviewData] = useState(null);
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

  // 📋 Charger l'aperçu de clôture
  const loadCloturePreview = async (collecteurId, date) => {
    if (!collecteurId || !date) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/versements/preview?collecteurId=${collecteurId}&date=${date}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setPreviewData(result.data);
        // Pré-remplir le montant versé avec le solde du compte service
        setMontantVerse(result.data.soldeCompteService?.toString() || '0');
      } else {
        setError(result.error || 'Erreur lors du chargement de l\'aperçu');
      }
    } catch (err) {
      console.error('Erreur chargement aperçu:', err);
      setError(err.message || 'Erreur lors du chargement de l\'aperçu');
    } finally {
      setLoading(false);
    }
  };

  // Helper pour récupérer le token
  const getAuthToken = async () => {
    // Votre logique pour récupérer le token
    // Par exemple depuis AsyncStorage ou votre service d'auth
    return 'your-auth-token';
  };

  // Gérer le changement de collecteur
  const handleCollecteurChange = (collecteurId) => {
    setSelectedCollecteur(collecteurId);
    setPreviewData(null);
    setMontantVerse('');
    setCommentaire('');
    if (collecteurId && selectedDate) {
      loadCloturePreview(collecteurId, selectedDate);
    }
  };

  // Gérer le changement de date
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setPreviewData(null);
    setMontantVerse('');
    setCommentaire('');
    if (selectedCollecteur && date) {
      loadCloturePreview(selectedCollecteur, date);
    }
  };

  // 💰 Effectuer le versement et la clôture
  const handleVersementEtCloture = () => {
    if (!selectedCollecteur || !selectedDate || !previewData || !montantVerse) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const montantVerseNum = parseFloat(montantVerse);
    const montantCollecte = previewData.soldeCompteService || 0;
    
    if (isNaN(montantVerseNum) || montantVerseNum < 0) {
      Alert.alert('Erreur', 'Le montant versé doit être un nombre positif.');
      return;
    }

    let alertMessage = `Confirmez-vous le versement de ${formatCurrency(montantVerseNum)} ?\n\n`;
    alertMessage += `Montant collecté : ${formatCurrency(montantCollecte)}\n`;
    
    const difference = montantVerseNum - montantCollecte;
    if (difference > 0) {
      alertMessage += `Excédent : +${formatCurrency(difference)} (sera crédité au compte attente)`;
    } else if (difference < 0) {
      alertMessage += `Manquant : ${formatCurrency(Math.abs(difference))} (sera débité du compte manquant)`;
    } else {
      alertMessage += `Montant équilibré ✓`;
    }

    Alert.alert(
      'Confirmation de versement',
      alertMessage,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: executeVersementEtCloture }
      ]
    );
  };

  // Exécuter le versement
  const executeVersementEtCloture = async () => {
    try {
      setCloturing(true);
      setError(null);

      const request = {
        collecteurId: selectedCollecteur,
        date: selectedDate,
        montantVerse: parseFloat(montantVerse),
        commentaire: commentaire.trim() || null
      };

      const response = await fetch('/api/admin/versements/cloture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (result.success) {
        // Succès - afficher le résultat
        let successMessage = 'Versement effectué et journal clôturé avec succès !';
        
        if (result.data.manquant && result.data.manquant > 0) {
          successMessage += `\n\n⚠️ Manquant détecté : ${formatCurrency(result.data.manquant)}`;
        } else if (result.data.excedent && result.data.excedent > 0) {
          successMessage += `\n\n💰 Excédent détecté : ${formatCurrency(result.data.excedent)}`;
        }

        Alert.alert(
          'Succès',
          successMessage,
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Réinitialiser le formulaire
                setSelectedCollecteur(null);
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                setPreviewData(null);
                setMontantVerse('');
                setCommentaire('');
              }
            }
          ]
        );
      } else {
        setError(result.error || 'Erreur lors du versement');
      }
    } catch (err) {
      console.error('Erreur versement:', err);
      setError(err.message || 'Erreur lors du versement');
    } finally {
      setCloturing(false);
    }
  };

  // Formater la devise
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  };

  // Calculer la différence en temps réel
  const calculateDifference = () => {
    if (!previewData || !montantVerse) return null;
    
    const montantVerseNum = parseFloat(montantVerse);
    const montantCollecte = previewData.soldeCompteService || 0;
    
    if (isNaN(montantVerseNum)) return null;
    
    return montantVerseNum - montantCollecte;
  };

  const difference = calculateDifference();

  // Rendu d'une opération
  const renderOperation = ({ item }) => (
    <View style={styles.operationItem}>
      <View style={styles.operationInfo}>
        <Text style={styles.operationClient}>
          {item.clientNom} {item.clientPrenom}
        </Text>
        <Text style={styles.operationType}>{item.type}</Text>
        <Text style={styles.operationDate}>
          {format(new Date(item.dateOperation), 'HH:mm')}
        </Text>
      </View>
      <View style={styles.operationAmount}>
        <Text style={[
          styles.operationValue,
          { color: item.type === 'EPARGNE' ? theme.colors.success : theme.colors.error }
        ]}>
          {item.type === 'RETRAIT' ? '-' : '+'}{formatCurrency(item.montant)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Clôture & Versement"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Aperçu des données */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement de l'aperçu...</Text>
          </View>
        ) : previewData ? (
          <>
            {/* Résumé comptable */}
            <Card style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Résumé Comptable</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Statut Journal:</Text>
                <View style={[
                  styles.statusBadge,
                  previewData.dejaClôture ? styles.closedBadge : styles.openBadge
                ]}>
                  <Text style={styles.statusText}>
                    {previewData.dejaClôture ? 'Déjà Clôturé' : 'Ouvert'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Solde Compte Service:</Text>
                <Text style={[styles.summaryValue, styles.primaryAmount]}>
                  {formatCurrency(previewData.soldeCompteService)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Épargne:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                  {formatCurrency(previewData.totalEpargne)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Retraits:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                  {formatCurrency(previewData.totalRetraits)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nombre d'opérations:</Text>
                <Text style={styles.summaryValue}>{previewData.nombreOperations}</Text>
              </View>

              {previewData.soldeCompteManquant > 0 && (
                <View style={[styles.summaryRow, styles.warningRow]}>
                  <Text style={styles.summaryLabel}>Manquant actuel:</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                    {formatCurrency(previewData.soldeCompteManquant)}
                  </Text>
                </View>
              )}
            </Card>

            {/* Formulaire de versement */}
            {!previewData.dejaClôture && (
              <Card style={styles.versementCard}>
                <Text style={styles.cardTitle}>Versement en Espèces</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Montant versé en espèces <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    value={montantVerse}
                    onChangeText={setMontantVerse}
                    keyboardType="numeric"
                    editable={!cloturing}
                  />
                  <Text style={styles.inputHint}>
                    Montant à collecter : {formatCurrency(previewData.soldeCompteService)}
                  </Text>
                </View>

                {/* Affichage de la différence */}
                {difference !== null && (
                  <View style={[
                    styles.differenceContainer,
                    difference > 0 ? styles.excedentContainer : 
                    difference < 0 ? styles.manquantContainer : 
                    styles.equilibreContainer
                  ]}>
                    <Ionicons 
                      name={difference > 0 ? "trending-up" : difference < 0 ? "trending-down" : "checkmark-circle"} 
                      size={20} 
                      color={difference > 0 ? theme.colors.success : difference < 0 ? theme.colors.error : theme.colors.primary}
                    />
                    <Text style={[
                      styles.differenceText,
                      { color: difference > 0 ? theme.colors.success : difference < 0 ? theme.colors.error : theme.colors.primary }
                    ]}>
                      {difference > 0 ? `Excédent: +${formatCurrency(Math.abs(difference))}` :
                       difference < 0 ? `Manquant: -${formatCurrency(Math.abs(difference))}` :
                       'Montant équilibré ✓'}
                    </Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Commentaire (optionnel)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Observations éventuelles..."
                    value={commentaire}
                    onChangeText={setCommentaire}
                    multiline
                    numberOfLines={3}
                    editable={!cloturing}
                  />
                </View>
              </Card>
            )}

            {/* Liste des opérations */}
            {previewData.operations && previewData.operations.length > 0 && (
              <Card style={styles.operationsCard}>
                <Text style={styles.cardTitle}>
                  Opérations du jour ({previewData.operations.length})
                </Text>

                <FlatList
                  data={previewData.operations}
                  renderItem={renderOperation}
                  keyExtractor={item => item.id.toString()}
                  style={styles.operationsList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                />
              </Card>
            )}

            {/* Bouton de clôture */}
            {!previewData.dejaClôture && (
              <Button
                title="Effectuer le versement et clôturer"
                onPress={handleVersementEtCloture}
                loading={cloturing}
                disabled={cloturing || !montantVerse || parseFloat(montantVerse) < 0}
                style={styles.clotureButton}
                icon="checkmark-circle"
              />
            )}
          </>
        ) : selectedCollecteur && selectedDate ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-outline" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyText}>
              Aucune donnée trouvée pour cette date
            </Text>
          </Card>
        ) : null}
      </ScrollView>
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
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
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
  warningRow: {
    backgroundColor: `${theme.colors.error}10`,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  primaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
  versementCard: {
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: theme.colors.error,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  differenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  excedentContainer: {
    backgroundColor: `${theme.colors.success}15`,
  },
  manquantContainer: {
    backgroundColor: `${theme.colors.error}15`,
  },
  equilibreContainer: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  differenceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  operationsCard: {
    padding: 16,
    marginBottom: 16,
  },
  operationsList: {
    maxHeight: 300,
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
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  clotureButton: {
    marginBottom: 32,
  },
});

export default JournalClotureScreen;