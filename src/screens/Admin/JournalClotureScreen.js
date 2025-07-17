// src/screens/Admin/JournalClotureScreen.js - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import CollecteurSelector from '../../components/CollecteurSelector/CollecteurSelector';
import DateSelector from '../../components/DateSelector/DateSelector';
import theme from '../../theme';
import { versementService, collecteurService } from '../../services';

const JournalClotureScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // États de sélection
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collecteurs, setCollecteurs] = useState([]);
  
  // États des données
  const [preview, setPreview] = useState(null);
  const [montantVerse, setMontantVerse] = useState('');
  const [commentaire, setCommentaire] = useState('');
  
  // États de l'interface
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCollecteurs();
  }, []);

  useEffect(() => {
    if (selectedCollecteur && selectedDate) {
      loadPreview();
    }
  }, [selectedCollecteur, selectedDate]);

  const loadCollecteurs = async () => {
    try {
      const response = await collecteurService.getCollecteurs();
      if (response.success) {
        setCollecteurs(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement collecteurs:', err);
      setError('Impossible de charger les collecteurs');
    }
  };

  const loadPreview = async () => {
    try {
      setLoadingPreview(true);
      setError(null);
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await versementService.getCloturePreview(
        selectedCollecteur.id, 
        dateStr
      );
      
      if (response.success) {
        setPreview(response.data);
        // Pré-remplir le montant avec le solde du compte service
        setMontantVerse(response.data.soldeCompteService?.toString() || '');
      } else {
        setError(response.error || 'Erreur lors du chargement de l\'aperçu');
        setPreview(null);
      }
    } catch (err) {
      console.error('Erreur aperçu:', err);
      setError('Impossible de charger l\'aperçu de clôture');
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const calculerDifference = () => {
    if (!preview || !montantVerse) return null;
    
    const montantCollecte = preview.soldeCompteService || 0;
    const montantSaisi = parseFloat(montantVerse) || 0;
    const difference = montantSaisi - montantCollecte;
    
    return {
      difference,
      type: difference > 0 ? 'excedent' : difference < 0 ? 'manquant' : 'equilibre',
      montant: Math.abs(difference)
    };
  };

  const validateForm = () => {
    if (!selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return false;
    }
    
    if (!montantVerse || isNaN(parseFloat(montantVerse))) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return false;
    }
    
    if (parseFloat(montantVerse) < 0) {
      Alert.alert('Erreur', 'Le montant ne peut pas être négatif');
      return false;
    }
    
    if (!preview?.journalExiste) {
      Alert.alert('Erreur', 'Aucun journal trouvé pour cette date');
      return false;
    }
    
    if (preview?.dejaClôture) {
      Alert.alert('Erreur', 'Le journal est déjà clôturé');
      return false;
    }
    
    return true;
  };

  const handleCloture = async () => {
    if (!validateForm()) return;
    
    const difference = calculerDifference();
    let confirmMessage = `Confirmer la clôture du journal ?\n\n`;
    confirmMessage += `Collecteur: ${selectedCollecteur.nom} ${selectedCollecteur.prenom}\n`;
    confirmMessage += `Date: ${format(selectedDate, 'dd/MM/yyyy', { locale: fr })}\n`;
    confirmMessage += `Montant collecté: ${preview.soldeCompteService} FCFA\n`;
    confirmMessage += `Montant versé: ${montantVerse} FCFA\n`;
    
    if (difference && difference.type === 'manquant') {
      confirmMessage += `\n⚠️ MANQUANT: ${difference.montant} FCFA\n`;
      confirmMessage += `Ce montant sera ajouté au compte manquant du collecteur.`;
    } else if (difference && difference.type === 'excedent') {
      confirmMessage += `\n✅ EXCÉDENT: ${difference.montant} FCFA\n`;
      confirmMessage += `Ce montant sera ajouté au compte attente du collecteur.`;
    } else {
      confirmMessage += `\n✅ Montant équilibré`;
    }
    
    Alert.alert(
      'Clôture du journal',
      confirmMessage,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: executeClotureJournal
        }
      ]
    );
  };

  const executeClotureJournal = async () => {
    try {
      setLoading(true);
      
      const versementData = {
        collecteurId: selectedCollecteur.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        montantVerse: parseFloat(montantVerse),
        commentaire: commentaire.trim() || null
      };
      
      const response = await versementService.effectuerVersementEtCloture(versementData);
      
      if (response.success) {
        Alert.alert(
          'Succès',
          'Journal clôturé avec succès !',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset du formulaire
                setSelectedCollecteur(null);
                setSelectedDate(new Date());
                setMontantVerse('');
                setCommentaire('');
                setPreview(null);
                
                // Retour ou navigation
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', response.error || 'Erreur lors de la clôture');
      }
    } catch (err) {
      console.error('Erreur clôture:', err);
      Alert.alert('Erreur', 'Impossible de clôturer le journal');
    } finally {
      setLoading(false);
    }
  };

  const difference = calculerDifference();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Clôture de journal"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélection collecteur et date */}
        <Card style={styles.selectionCard}>
          <Text style={styles.cardTitle}>Sélection</Text>
          
          <CollecteurSelector
            collecteurs={collecteurs}
            selectedCollecteur={selectedCollecteur}
            onSelectCollecteur={setSelectedCollecteur}
            placeholder="Sélectionner un collecteur"
          />
          
          <DateSelector
            date={selectedDate}
            onDateChange={setSelectedDate}
            style={styles.dateSelector}
          />
        </Card>

        {/* Aperçu et données */}
        {selectedCollecteur && (
          <>
            {loadingPreview ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement de l'aperçu...</Text>
              </Card>
            ) : error ? (
              <Card style={styles.errorCard}>
                <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadPreview} style={styles.retryButton}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </Card>
            ) : preview ? (
              <>
                {/* Résumé du journal */}
                <Card style={styles.summaryCard}>
                  <Text style={styles.cardTitle}>Résumé du journal</Text>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Journal:</Text>
                    <Text style={styles.summaryValue}>{preview.referenceJournal}</Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Nombre d'opérations:</Text>
                    <Text style={styles.summaryValue}>{preview.nombreOperations}</Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Solde compte service:</Text>
                    <Text style={[styles.summaryValue, styles.primaryAmount]}>
                      {new Intl.NumberFormat('fr-FR').format(preview.soldeCompteService)} FCFA
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Statut:</Text>
                    <View style={[
                      styles.statusBadge,
                      preview.dejaClôture ? styles.closedBadge : styles.openBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {preview.dejaClôture ? 'CLÔTURÉ' : 'OUVERT'}
                      </Text>
                    </View>
                  </View>
                  
                  {preview.dejaClôture && (
                    <View style={[styles.summaryRow, styles.warningRow]}>
                      <Ionicons name="warning" size={20} color={theme.colors.error} />
                      <Text style={[styles.summaryLabel, { color: theme.colors.error }]}>
                        Ce journal est déjà clôturé
                      </Text>
                    </View>
                  )}
                </Card>

                {/* Formulaire de versement */}
                {!preview.dejaClôture && (
                  <Card style={styles.versementCard}>
                    <Text style={styles.cardTitle}>Versement</Text>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Montant versé en espèces <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={montantVerse}
                        onChangeText={setMontantVerse}
                        placeholder="0"
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                      <Text style={styles.inputHint}>
                        Montant que le collecteur a réellement apporté en espèces
                      </Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Commentaire (optionnel)</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={commentaire}
                        onChangeText={setCommentaire}
                        placeholder="Ajouter un commentaire..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                    
                    {/* Affichage de la différence */}
                    {difference && montantVerse && (
                      <View style={[
                        styles.differenceContainer,
                        difference.type === 'excedent' && styles.excedentContainer,
                        difference.type === 'manquant' && styles.manquantContainer,
                        difference.type === 'equilibre' && styles.equilibreContainer
                      ]}>
                        <Ionicons 
                          name={
                            difference.type === 'excedent' ? 'trending-up' :
                            difference.type === 'manquant' ? 'trending-down' : 'checkmark-circle'
                          }
                          size={24}
                          color={
                            difference.type === 'excedent' ? theme.colors.success :
                            difference.type === 'manquant' ? theme.colors.error : theme.colors.primary
                          }
                        />
                        <Text style={[
                          styles.differenceText,
                          {
                            color: difference.type === 'excedent' ? theme.colors.success :
                                   difference.type === 'manquant' ? theme.colors.error : theme.colors.primary
                          }
                        ]}>
                          {difference.type === 'excedent' && `Excédent: +${difference.montant} FCFA`}
                          {difference.type === 'manquant' && `Manquant: -${difference.montant} FCFA`}
                          {difference.type === 'equilibre' && 'Montant équilibré'}
                        </Text>
                      </View>
                    )}
                  </Card>
                )}

                {/* Liste des opérations */}
                {preview.operations && preview.operations.length > 0 && (
                  <Card style={styles.operationsCard}>
                    <Text style={styles.cardTitle}>Opérations du jour ({preview.operations.length})</Text>
                    
                    <ScrollView style={styles.operationsList} nestedScrollEnabled>
                      {preview.operations.map((operation, index) => (
                        <View key={operation.id || index} style={styles.operationItem}>
                          <View style={styles.operationInfo}>
                            <Text style={styles.operationClient}>
                              {operation.clientPrenom} {operation.clientNom}
                            </Text>
                            <Text style={styles.operationType}>{operation.type}</Text>
                            <Text style={styles.operationDate}>
                              {format(new Date(operation.dateOperation), 'HH:mm', { locale: fr })}
                            </Text>
                          </View>
                          <View style={styles.operationAmount}>
                            <Text style={[
                              styles.operationValue,
                              {
                                color: operation.type === 'EPARGNE' ? 
                                  theme.colors.success : theme.colors.error
                              }
                            ]}>
                              {operation.type === 'EPARGNE' ? '+' : '-'}
                              {new Intl.NumberFormat('fr-FR').format(operation.montant)} FCFA
                            </Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </Card>
                )}
              </>
            ) : null}
          </>
        )}

        {/* Bouton de clôture */}
        {preview && !preview.dejaClôture && montantVerse && (
          <Button
            title={loading ? "Clôture en cours..." : "Clôturer le journal"}
            onPress={handleCloture}
            disabled={loading || !validateForm()}
            loading={loading}
            style={styles.clotureButton}
          />
        )}
      </ScrollView>
    </View>
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
    padding: 20,
  },
  selectionCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  dateSelector: {
    marginTop: 16,
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.white,
    fontWeight: '500',
  },
  summaryCard: {
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
  clotureButton: {
    marginBottom: 32,
  },
});

export default JournalClotureScreen;