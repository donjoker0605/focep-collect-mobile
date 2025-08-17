// src/screens/Admin/JournalClotureScreen.js - CORRECTION AVERTISSEMENT
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
      console.log('🔄 Chargement des collecteurs...');
      const response = await collecteurService.getCollecteurs();
      
      console.log('📦 Réponse complète:', response);
      
      if (response.success) {
        const collecteursData = response.data || [];
        console.log('👥 Collecteurs récupérés:', collecteursData);
        setCollecteurs(collecteursData);
        
        if (collecteursData.length === 0) {
          setError('Aucun collecteur trouvé');
        }
      } else {
        console.error('❌ Réponse API non réussie:', response);
        setError('Erreur lors du chargement des collecteurs');
      }
    } catch (err) {
      console.error('❌ Erreur chargement collecteurs:', err);
      setError('Impossible de charger les collecteurs');
    }
  };

  const loadPreview = async () => {
    try {
      setLoadingPreview(true);
      setError(null);
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔄 Chargement aperçu pour:', {
        collecteurId: selectedCollecteur.id,
        date: dateStr
      });
      
      const response = await versementService.getCloturePreview(
        selectedCollecteur.id, 
        dateStr
      );
      
      if (response.success) {
        setPreview(response.data);
        // 🔥 CORRECTION: Pré-remplir avec la valeur absolue du solde
        const montantDu = Math.abs(response.data.soldeCompteService || 0);
        setMontantVerse(montantDu.toString());
      } else {
        setError(response.error || 'Erreur lors du chargement de l\'aperçu');
        setPreview(null);
      }
    } catch (err) {
      console.error('❌ Erreur aperçu:', err);
      setError('Impossible de charger l\'aperçu de clôture');
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ✅ FONCTION CORRIGÉE : Calcul de la différence avec valeur absolue
  const calculerDifferenceCorrigee = () => {
    if (!preview || !montantVerse) return null;
    
    // 🔥 CORRECTION CRITIQUE : Utiliser la valeur absolue du solde du compte service
    const montantDu = Math.abs(preview.soldeCompteService || 0);
    const montantSaisi = parseFloat(montantVerse) || 0;
    const difference = montantSaisi - montantDu;
    
    console.log('🔧 CALCUL CORRIGÉ:', {
      soldeCompteService: preview.soldeCompteService,
      montantDu,
      montantSaisi,
      difference,
      type: difference > 0 ? 'excedent' : difference < 0 ? 'manquant' : 'equilibre'
    });
    
    return {
      difference,
      type: difference > 0 ? 'excedent' : difference < 0 ? 'manquant' : 'equilibre',
      montant: Math.abs(difference),
      montantDu: montantDu,
      montantSaisi: montantSaisi
    };
  };

  // ✅ FONCTION : Validation silencieuse du formulaire (pour disabled)
  const isFormValid = () => {
    if (!selectedCollecteur) return false;
    if (!montantVerse || isNaN(parseFloat(montantVerse))) return false;
    if (parseFloat(montantVerse) < 0) return false;
    if (!preview?.journalExiste) return false;
    if (preview?.dejaClôture) return false;
    return true;
  };

  // ✅ FONCTION : Validation avec messages d'erreur (pour handleClotureCorrigee)
  const validateFormCorrige = () => {
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
      Alert.alert('Information', 'Ce journal est déjà clôturé');
      return false;
    }
    
    return true;
  };

  // ✅ FONCTION CORRIGÉE : Gestion de la clôture avec calcul corrigé
  const handleClotureCorrigee = async () => {
    console.log('🔄 Clic sur bouton clôture - Démarrage validation...');
    if (!validateFormCorrige()) {
      console.log('❌ Validation échouée - Arrêt du processus');
      return;
    }
    console.log('✅ Validation réussie - Affichage confirmation...');
    
    const differenceCorrigee = calculerDifferenceCorrigee();
    
    // 🔥 CORRECTION : Utiliser la valeur absolue du solde
    const montantDu = Math.abs(preview.soldeCompteService || 0);
    
    let confirmMessage = `Confirmer la clôture du journal ?\n\n`;
    confirmMessage += `Collecteur: ${selectedCollecteur.nom} ${selectedCollecteur.prenom}\n`;
    confirmMessage += `Date: ${format(selectedDate, 'dd/MM/yyyy', { locale: fr })}\n`;
    confirmMessage += `Montant dû: ${montantDu.toLocaleString('fr-FR')} FCFA\n`;
    confirmMessage += `Montant versé: ${montantVerse} FCFA\n`;
    
    if (differenceCorrigee && differenceCorrigee.type === 'manquant') {
      confirmMessage += `\n⚠️ MANQUANT: ${differenceCorrigee.montant.toLocaleString('fr-FR')} FCFA\n`;
      confirmMessage += `Ce montant sera ajouté comme dette au compte manquant du collecteur.`;
    } else if (differenceCorrigee && differenceCorrigee.type === 'excedent') {
      confirmMessage += `\n✅ EXCÉDENT: ${differenceCorrigee.montant.toLocaleString('fr-FR')} FCFA\n`;
      confirmMessage += `Ce montant sera crédité au compte manquant du collecteur.`;
    } else {
      confirmMessage += `\n✅ Montant équilibré - Versement normal`;
    }
    
    console.log('🎯 Tentative d\'affichage Alert.alert...');
    
    // ✅ SOLUTION CROSS-PLATFORM : Gestion web + mobile
    if (typeof window !== 'undefined') {
      // Mode web : utiliser window.confirm
      console.log('🌐 Mode Web détecté - Utilisation window.confirm');
      const userConfirmed = window.confirm(confirmMessage);
      console.log('🤔 Utilisateur a confirmé:', userConfirmed);
      if (userConfirmed) {
        executeClotureJournalCorrige();
      }
    } else {
      // Mode mobile : utiliser Alert.alert
      console.log('📱 Mode Mobile - Utilisation Alert.alert');
      Alert.alert(
        'Clôture du journal',
        confirmMessage,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Confirmer', 
            style: 'destructive',
            onPress: executeClotureJournalCorrige
          }
        ]
      );
    }
  };

  // ✅ FONCTION CORRIGÉE : Exécution de la clôture
  const executeClotureJournalCorrige = async () => {
    try {
      console.log('🚀 DÉMARRAGE executeClotureJournalCorrige...');
      setLoading(true);
      
      const versementData = {
        collecteurId: selectedCollecteur.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        montantVerse: parseFloat(montantVerse),
        commentaire: commentaire.trim() || null
      };
      
      console.log('🔄 Exécution clôture avec logique corrigée:', versementData);
      console.log('📡 Appel API versementService.effectuerVersementEtCloture...');
      
      const response = await versementService.effectuerVersementEtCloture(versementData);
      
      console.log('✅ Réponse API reçue:', response);
      
      if (response.success) {
        console.log('🎉 Clôture réussie !');
        
        // ✅ SOLUTION CROSS-PLATFORM : Message de succès
        if (typeof window !== 'undefined') {
          window.alert('Journal clôturé avec succès !');
        } else {
          Alert.alert('Succès', 'Journal clôturé avec succès !');
        }
        
        // Reset du formulaire
        setSelectedCollecteur(null);
        setSelectedDate(new Date());
        setMontantVerse('');
        setCommentaire('');
        setPreview(null);
        
        // Retour ou navigation
        navigation.goBack();
      } else {
        console.log('❌ Erreur clôture:', response.error);
        
        // ✅ SOLUTION CROSS-PLATFORM : Message d'erreur
        if (typeof window !== 'undefined') {
          window.alert('Erreur: ' + (response.error || 'Erreur lors de la clôture'));
        } else {
          Alert.alert('Erreur', response.error || 'Erreur lors de la clôture');
        }
      }
    } catch (err) {
      console.error('❌ Erreur clôture avec logique corrigée:', err);
      
      // ✅ SOLUTION CROSS-PLATFORM : Message d'erreur catch
      if (typeof window !== 'undefined') {
        window.alert('Erreur: Impossible de clôturer le journal');
      } else {
        Alert.alert('Erreur', 'Impossible de clôturer le journal');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ COMPOSANT CORRIGÉ : Affichage de la différence
  const DifferenceDisplay = () => {
    const differenceCorrigee = calculerDifferenceCorrigee();
    
    if (!differenceCorrigee || !montantVerse) return null;
    
    return (
      <View style={[
        styles.differenceContainer,
        differenceCorrigee.type === 'excedent' && styles.excedentContainer,
        differenceCorrigee.type === 'manquant' && styles.manquantContainer,
        differenceCorrigee.type === 'equilibre' && styles.equilibreContainer
      ]}>
        <Ionicons 
          name={
            differenceCorrigee.type === 'excedent' ? 'trending-up' :
            differenceCorrigee.type === 'manquant' ? 'trending-down' : 'checkmark-circle'
          }
          size={24}
          color={
            differenceCorrigee.type === 'excedent' ? theme.colors.success :
            differenceCorrigee.type === 'manquant' ? theme.colors.error : theme.colors.primary
          }
        />
        <View style={styles.differenceTextContainer}>
          <Text style={[
            styles.differenceText,
            {
              color: differenceCorrigee.type === 'excedent' ? theme.colors.success :
                     differenceCorrigee.type === 'manquant' ? theme.colors.error : theme.colors.primary
            }
          ]}>
            {differenceCorrigee.type === 'excedent' && 
              `Excédent: +${differenceCorrigee.montant.toLocaleString('fr-FR')} FCFA`}
            {differenceCorrigee.type === 'manquant' && 
              `Manquant: -${differenceCorrigee.montant.toLocaleString('fr-FR')} FCFA`}
            {differenceCorrigee.type === 'equilibre' && 'Montant équilibré'}
          </Text>
          <Text style={styles.differenceDetail}>
            {`Montant dû: ${differenceCorrigee.montantDu.toLocaleString('fr-FR')} FCFA`}
          </Text>
        </View>
      </View>
    );
  };

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
          
          {/* 🔥 CORRECTION AVERTISSEMENT : Encapsuler tous les textes dans <Text> */}
          {__DEV__ && (
            <Text style={styles.debugText}>
              {`Collecteurs chargés: ${collecteurs.length}`}
            </Text>
          )}
          
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

        {/* Message d'erreur */}
        {error && (
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadCollecteurs} style={styles.retryButton}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Aperçu et données */}
        {selectedCollecteur && (
          <>
            {loadingPreview ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement de l'aperçu...</Text>
              </Card>
            ) : preview ? (
              <>
                {/* Résumé du journal */}
                <Card style={styles.summaryCard}>
                  <Text style={styles.cardTitle}>Résumé du journal</Text>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Journal:</Text>
                    <Text style={styles.summaryValue}>
                      {preview.referenceJournal || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Nombre d'opérations:</Text>
                    <Text style={styles.summaryValue}>
                      {`${preview.nombreOperations || 0}`}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Solde compte service:</Text>
                    <Text style={[styles.summaryValue, styles.primaryAmount]}>
                      {`${new Intl.NumberFormat('fr-FR').format(preview.soldeCompteService || 0)} FCFA`}
                    </Text>
                  </View>

                  {/* 🔥 AJOUT: Affichage du montant dû calculé */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Montant dû (calculé):</Text>
                    <Text style={[styles.summaryValue, styles.duAmount]}>
                      {`${new Intl.NumberFormat('fr-FR').format(Math.abs(preview.soldeCompteService || 0))} FCFA`}
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
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={[styles.summaryLabel, { color: theme.colors.success }]}>
                        Ce journal a été clôturé avec succès
                      </Text>
                    </View>
                  )}
                </Card>

                {/* 🔥 NOUVELLE SECTION : Information pour journal clôturé */}
                {preview.dejaClôture && (
                  <Card style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                      <Text style={styles.infoTitle}>Journal clôturé</Text>
                    </View>
                    <Text style={styles.infoText}>
                      Ce journal a été clôturé avec succès. Les informations affichées sont en mode lecture seule.
                    </Text>
                    {preview.soldeCompteManquant !== 0 && (
                      <Text style={styles.infoSubText}>
                        {`Solde compte manquant: ${new Intl.NumberFormat('fr-FR').format(preview.soldeCompteManquant)} FCFA`}
                      </Text>
                    )}
                  </Card>
                )}

                {/* Formulaire de versement - Masqué si journal clôturé */}
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
                    
                    {/* ✅ UTILISATION DU COMPOSANT CORRIGÉ */}
                    <DifferenceDisplay />
                  </Card>
                )}

                {/* Liste des opérations */}
                {preview.operations && preview.operations.length > 0 && (
                  <Card style={styles.operationsCard}>
                    <Text style={styles.cardTitle}>
                      {`Opérations du jour (${preview.operations.length})`}
                    </Text>
                    
                    <ScrollView style={styles.operationsList} nestedScrollEnabled>
                      {preview.operations.map((operation, index) => (
                        <View key={operation.id || index} style={styles.operationItem}>
                          <View style={styles.operationInfo}>
                            <Text style={styles.operationClient}>
                              {`${operation.clientPrenom || ''} ${operation.clientNom || ''}`}
                            </Text>
                            <Text style={styles.operationType}>
                              {operation.type || 'N/A'}
                            </Text>
                            <Text style={styles.operationDate}>
                              {operation.dateOperation ? 
                                format(new Date(operation.dateOperation), 'HH:mm', { locale: fr }) : 
                                'N/A'}
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
                              {`${operation.type === 'EPARGNE' ? '+' : '-'}${new Intl.NumberFormat('fr-FR').format(operation.montant || 0)} FCFA`}
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

        {/* Bouton de clôture - Affiché seulement si pas clôturé */}
        {preview && !preview.dejaClôture && (
          <Button
            title={loading ? "Clôture en cours..." : "Clôturer le journal"}
            onPress={handleClotureCorrigee}
            disabled={loading || !isFormValid()}
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
  // 🐛 DEBUG: Style pour les infos de debug
  debugText: {
    fontSize: 12,
    color: theme.colors.warning,
    marginBottom: 8,
    fontStyle: 'italic',
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
    backgroundColor: `${theme.colors.success}10`,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
  duAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  closedBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  openBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  // 🔥 NOUVEAUX STYLES : Pour la section d'information
  infoCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.success + '10',
    borderColor: theme.colors.success + '30',
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  infoSubText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontStyle: 'italic',
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
  differenceTextContainer: {
    flex: 1,
    marginLeft: 8,
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
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  differenceDetail: {
    fontSize: 14,
    color: theme.colors.textLight,
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