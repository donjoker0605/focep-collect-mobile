// src/screens/Admin/ParameterManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as HapticsCompat from '../../utils/haptics';
import { useLocalSearchParams } from 'expo-router';

// Components
import {
  Header,
  Card,
  Button,
  Input,
  SelectInput,
  EmptyState
} from '../../components';

// Hooks, API et Utils
import { useAuth } from '../../hooks/useAuth';
import { 
  getSystemParameters, 
  updateSystemParameters,
  getCommissionParameters,
  updateCommissionParameters
} from '../../api/commission';
import theme from '../../theme';

const ParameterManagementScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Paramètres système
  const [systemParams, setSystemParams] = useState({
    commissionTvaRate: 0.1925,
    commissionEmfRate: 0.30,
    commissionNouveauCollecteurDuree: 3,
    commissionNouveauCollecteur: 40000,
    retraitMaximumCollecteur: 150000,
    clientInactifDelai: 30,
  });
  
  // Paramètres de commission par défaut
  const [commissionParams, setCommissionParams] = useState({
    type: 'PERCENTAGE',
    valeur: 0.05,
    paliers: []
  });
  
  // Effet pour récupérer les paliers mis à jour
  useEffect(() => {
    if (params.updatedTiers) {
      try {
        const updatedTiers = JSON.parse(params.updatedTiers);
        setCommissionParams(prev => ({
          ...prev,
          paliers: updatedTiers
        }));
      } catch (err) {
        console.error("Erreur lors du parsing des paliers mis à jour:", err);
      }
    }
  }, [params.updatedTiers]);

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadParameters();
  }, []);
  
  // Charger les paramètres depuis l'API
  const loadParameters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les paramètres système
      const sysParams = await getSystemParameters();
      setSystemParams(sysParams);
      
      // Charger les paramètres de commission par défaut
      const commParams = await getCommissionParameters('default');
      setCommissionParams(commParams);
      
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError(err.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer le mode d'édition
  const toggleEditMode = () => {
    if (editMode) {
      // Si on quitte le mode édition, demander confirmation
      Alert.alert(
        'Confirmation',
        'Quitter sans enregistrer ? Les modifications seront perdues.',
        [
          {
            text: 'Rester en mode édition',
            style: 'cancel'
          },
          {
            text: 'Quitter',
            onPress: () => {
              setEditMode(false);
              loadParameters(); // Recharger les paramètres d'origine
            }
          }
        ]
      );
    } else {
      setEditMode(true);
    }
    
    // Vibration de feedback
    HapticsCompat.impactAsync(HapticsCompat.ImpactFeedbackStyle.Light);
  };
  
  // Mettre à jour un paramètre système
  const updateSystemParam = (key, value) => {
    setSystemParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Mettre à jour un paramètre de commission
  const updateCommissionParam = (key, value) => {
    setCommissionParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Sauvegarder les modifications
  const handleSaveParameters = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Valider les données
      if (systemParams.commissionTvaRate < 0 || systemParams.commissionTvaRate > 1) {
        setError('Le taux de TVA doit être compris entre 0 et 1');
        return;
      }
      
      if (systemParams.commissionEmfRate < 0 || systemParams.commissionEmfRate > 1) {
        setError('Le taux EMF doit être compris entre 0 et 1');
        return;
      }
      
      if (systemParams.commissionNouveauCollecteurDuree < 0) {
        setError('La durée pour les nouveaux collecteurs doit être positive');
        return;
      }
      
      if (systemParams.commissionNouveauCollecteur < 0) {
        setError('La commission des nouveaux collecteurs doit être positive');
        return;
      }
      
      if (systemParams.retraitMaximumCollecteur < 0) {
        setError('Le montant maximum de retrait doit être positif');
        return;
      }
      
      if (systemParams.clientInactifDelai < 0) {
        setError('Le délai d\'inactivité doit être positif');
        return;
      }
      
      // Mettre à jour les paramètres système
      await updateSystemParameters(systemParams);
      
      // Mettre à jour les paramètres de commission par défaut
      await updateCommissionParameters('default', commissionParams);
      
      // Quitter le mode édition
      setEditMode(false);
      
      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'Les paramètres ont été mis à jour avec succès.',
        [{ text: 'OK' }]
      );
      
      // Vibration de succès
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError(err.message || 'Erreur lors de la mise à jour des paramètres');
      
      // Vibration d'erreur
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };
  
  // Si en cours de chargement
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Paramètres"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des paramètres...</Text>
        </View>
      </View>
    );
  }
  
  // Formater un pourcentage pour l'affichage
  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Convertir un pourcentage depuis l'affichage
  const parsePercent = (text) => {
    return parseFloat(text.replace('%', '')) / 100;
  };
  
  // Navigation vers l'écran de configuration des paliers
  const navigateToTiersConfig = () => {
    navigation.navigate('commission-tiers', { 
      tiers: JSON.stringify(commissionParams.paliers || []),
      onSave: (paliers) => updateCommissionParam('paliers', paliers)
    });
  };
  
  // Rendu principal
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Paramètres"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
            <Ionicons 
              name={editMode ? "close-outline" : "create-outline"} 
              size={24} 
              color={theme.colors.white} 
            />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Message d'erreur */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Paramètres de commission */}
        <Card style={styles.paramCard}>
          <Text style={styles.cardTitle}>Paramètres de commission</Text>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Taux de TVA</Text>
            {editMode ? (
              <Input
                value={(systemParams.commissionTvaRate * 100).toString()}
                onChangeText={(text) => updateSystemParam('commissionTvaRate', parseFloat(text) / 100)}
                keyboardType="numeric"
                style={styles.percentInput}
                suffix="%"
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>{formatPercent(systemParams.commissionTvaRate)}</Text>
            )}
          </View>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Taux EMF</Text>
            {editMode ? (
              <Input
                value={(systemParams.commissionEmfRate * 100).toString()}
                onChangeText={(text) => updateSystemParam('commissionEmfRate', parseFloat(text) / 100)}
                keyboardType="numeric"
                style={styles.percentInput}
                suffix="%"
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>{formatPercent(systemParams.commissionEmfRate)}</Text>
            )}
          </View>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Durée nouveau collecteur</Text>
            {editMode ? (
              <Input
                value={systemParams.commissionNouveauCollecteurDuree.toString()}
                onChangeText={(text) => updateSystemParam('commissionNouveauCollecteurDuree', parseInt(text, 10))}
                keyboardType="numeric"
                style={styles.numberInput}
                suffix="mois"
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>{systemParams.commissionNouveauCollecteurDuree} mois</Text>
            )}
          </View>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Commission nouveau collecteur</Text>
            {editMode ? (
              <Input
                value={systemParams.commissionNouveauCollecteur.toString()}
                onChangeText={(text) => updateSystemParam('commissionNouveauCollecteur', parseInt(text, 10))}
                keyboardType="numeric"
                style={styles.numberInput}
                suffix="FCFA"
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>{systemParams.commissionNouveauCollecteur.toLocaleString()} FCFA</Text>
            )}
          </View>
        </Card>
        
        {/* Paramètres opérationnels */}
        <Card style={styles.paramCard}>
          <Text style={styles.cardTitle}>Paramètres opérationnels</Text>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Montant max. de retrait</Text>
            {editMode ? (
              <Input
                value={systemParams.retraitMaximumCollecteur.toString()}
                onChangeText={(text) => updateSystemParam('retraitMaximumCollecteur', parseInt(text, 10))}
                keyboardType="numeric"
                style={styles.numberInput}
                suffix="FCFA"
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>{systemParams.retraitMaximumCollecteur.toLocaleString()} FCFA</Text>
            )}
          </View>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Délai d'inactivité client</Text>
            {editMode ? (
              <Input
                value={systemParams.clientInactifDelai.toString()}
                onChangeText={(text) => updateSystemParam('clientInactifDelai', parseInt(text, 10))}
                keyboardType="numeric"
                style={styles.numberInput}
                suffix="jours"
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>{systemParams.clientInactifDelai} jours</Text>
            )}
          </View>
        </Card>
        
        {/* Paramètres de commission par défaut */}
        <Card style={styles.paramCard}>
          <Text style={styles.cardTitle}>Commission par défaut</Text>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Type de commission</Text>
            {editMode ? (
              <SelectInput
                value={commissionParams.type}
                onChange={(value) => updateCommissionParam('type', value)}
                options={[
                  { label: 'Pourcentage', value: 'PERCENTAGE' },
                  { label: 'Montant fixe', value: 'FIXED' },
                  { label: 'Paliers', value: 'TIER' }
                ]}
                style={styles.typeSelect}
                disabled={saving}
              />
            ) : (
              <Text style={styles.paramValue}>
                {commissionParams.type === 'PERCENTAGE' ? 'Pourcentage' : 
                 commissionParams.type === 'FIXED' ? 'Montant fixe' : 'Paliers'}
              </Text>
            )}
          </View>
          
          {commissionParams.type === 'PERCENTAGE' && (
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Pourcentage</Text>
              {editMode ? (
                <Input
                  value={(commissionParams.valeur * 100).toString()}
                  onChangeText={(text) => updateCommissionParam('valeur', parseFloat(text) / 100)}
                  keyboardType="numeric"
                  style={styles.percentInput}
                  suffix="%"
                  disabled={saving}
                />
              ) : (
                <Text style={styles.paramValue}>{formatPercent(commissionParams.valeur)}</Text>
              )}
            </View>
          )}
          
          {commissionParams.type === 'FIXED' && (
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Montant fixe</Text>
              {editMode ? (
                <Input
                  value={commissionParams.valeur.toString()}
                  onChangeText={(text) => updateCommissionParam('valeur', parseFloat(text))}
                  keyboardType="numeric"
                  style={styles.numberInput}
                  suffix="FCFA"
                  disabled={saving}
                />
              ) : (
                <Text style={styles.paramValue}>{commissionParams.valeur.toLocaleString()} FCFA</Text>
              )}
              </View>
          )}
          
          {commissionParams.type === 'TIER' && (
            <View>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>Nombre de paliers</Text>
                <Text style={styles.paramValue}>
                  {commissionParams.paliers?.length || 0} palier(s)
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.tiersButton}
                onPress={navigateToTiersConfig}
                disabled={!editMode || saving}
              >
                <Text 
                  style={[
                    styles.tiersButtonText, 
                    (!editMode || saving) && styles.disabledText
                  ]}
                >
                  Configurer les paliers
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={(!editMode || saving) ? theme.colors.gray : theme.colors.primary} 
                />
              </TouchableOpacity>
              
              {commissionParams.paliers?.length > 0 && (
                <View style={styles.tiersPreview}>
                  {commissionParams.paliers.map((tier, index) => (
                    <View key={index} style={styles.tierPreviewItem}>
                      <Text style={styles.tierPreviewText}>
                        {tier.min.toLocaleString()} - {tier.max === 999999999 ? "∞" : tier.max.toLocaleString()} FCFA: {tier.rate}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>
        
        {/* Bouton de sauvegarde */}
        {editMode && (
          <Button
            title="Enregistrer les modifications"
            onPress={handleSaveParameters}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  editButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  
  // Cartes
  paramCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  
  // Lignes de paramètres
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  paramLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    paddingRight: 16,
  },
  paramValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  
  // Champs d'édition
  percentInput: {
    marginBottom: 0,
    width: 120,
  },
  numberInput: {
    marginBottom: 0,
    width: 180,
  },
  typeSelect: {
    marginBottom: 0,
    width: 180,
  },
  
  // Configuration des paliers
  tiersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  tiersButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  disabledText: {
    color: theme.colors.gray,
  },
  tiersPreview: {
    marginTop: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  tierPreviewItem: {
    paddingVertical: 4,
  },
  tierPreviewText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  
  // Bouton de sauvegarde
  saveButton: {
    marginTop: 16,
  },
});

export default ParameterManagementScreen;