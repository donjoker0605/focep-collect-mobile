// src/screens/Admin/CommissionParametersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const CommissionParametersScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { entityType, entityId, entityName } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [commissionType, setCommissionType] = useState('PERCENTAGE'); // FIXED, PERCENTAGE, TIER
  const [fixedAmount, setFixedAmount] = useState('');
  const [percentageValue, setPercentageValue] = useState('5'); // Default 5%
  const [tiers, setTiers] = useState([
    { id: 1, min: 0, max: 50000, rate: 5 },
    { id: 2, min: 50001, max: 100000, rate: 4 },
    { id: 3, min: 100001, max: 999999999, rate: 3 },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [commissionParams, setCommissionParams] = useState(null);

  // Charger les paramètres de commission existants
  useEffect(() => {
    if (entityType && entityId) {
      fetchCommissionParameters();
    } else {
      setLoadingData(false);
    }
  }, [entityType, entityId]);

  const fetchCommissionParameters = () => {
    setLoadingData(true);
    
    // Simuler une requête API
    setTimeout(() => {
      // Simuler l'absence de paramètres personnalisés
      if (Math.random() > 0.5) {
        setCommissionParams(null);
        setIsEditing(false);
        // Utiliser les valeurs par défaut
        setLoadingData(false);
        return;
      }
      
      // Simuler des paramètres existants (pour la démo)
      const mockParams = {
        id: 123,
        type: ['FIXED', 'PERCENTAGE', 'TIER'][Math.floor(Math.random() * 3)],
        value: Math.random() > 0.5 ? 5000 : 5, // Pour FIXED ou PERCENTAGE
        tiers: [
          { id: 1, min: 0, max: 50000, rate: 5 },
          { id: 2, min: 50001, max: 100000, rate: 4 },
          { id: 3, min: 100001, max: 999999999, rate: 3 },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCommissionParams(mockParams);
      setCommissionType(mockParams.type);
      
      if (mockParams.type === 'FIXED') {
        setFixedAmount(mockParams.value.toString());
      } else if (mockParams.type === 'PERCENTAGE') {
        setPercentageValue(mockParams.value.toString());
      } else if (mockParams.type === 'TIER') {
        setTiers(mockParams.tiers);
      }
      
      setIsActive(mockParams.isActive);
      setIsEditing(true);
      setLoadingData(false);
    }, 1000);
  };

  const handleSelectType = (type) => {
    setCommissionType(type);
  };

  const handleAddTier = () => {
    // Trouver le max de l'entité la plus élevée
    const maxTier = tiers.reduce((max, tier) => Math.max(max, tier.max), 0);
    
    const newTier = {
      id: Date.now(),
      min: maxTier + 1,
      max: maxTier + 50000,
      rate: 2,
    };
    
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (id) => {
    // Vérifier qu'il reste au moins un tier
    if (tiers.length <= 1) {
      Alert.alert("Erreur", "Vous devez conserver au moins un palier.");
      return;
    }
    
    const updatedTiers = tiers.filter(tier => tier.id !== id);
    
    // Ajuster les bornes des tiers restants
    if (updatedTiers.length > 0) {
      updatedTiers.sort((a, b) => a.min - b.min);
      
      for (let i = 0; i < updatedTiers.length - 1; i++) {
        updatedTiers[i + 1].min = updatedTiers[i].max + 1;
      }
      
      // S'assurer que le dernier tier va jusqu'à l'infini
      if (updatedTiers.length > 0) {
        updatedTiers[updatedTiers.length - 1].max = 999999999;
      }
    }
    
    setTiers(updatedTiers);
  };

  const handleUpdateTier = (id, field, value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) && field !== 'max') return;
    
    const updatedTiers = tiers.map(tier => {
      if (tier.id === id) {
        // Pour le champ "max" spécial "∞"
        if (field === 'max' && value === '∞') {
          return { ...tier, max: 999999999 };
        }
        return { ...tier, [field]: numericValue };
      }
      return tier;
    });
    
    // Trier les tiers par min
    updatedTiers.sort((a, b) => a.min - b.min);
    
    // Ajuster les bornes des tiers pour éviter les chevauchements
    for (let i = 0; i < updatedTiers.length - 1; i++) {
      // Si la borne max du tier actuel est supérieure à la borne min du tier suivant
      if (updatedTiers[i].max >= updatedTiers[i + 1].min) {
        // Ajuster la borne min du tier suivant
        updatedTiers[i + 1].min = updatedTiers[i].max + 1;
      }
    }
    
    setTiers(updatedTiers);
  };

  const handleSave = () => {
    setLoading(true);
    
    let commissionData = {
      entityType,
      entityId,
      isActive,
      type: commissionType,
    };
    
    if (commissionType === 'FIXED') {
      commissionData.value = parseFloat(fixedAmount) || 0;
    } else if (commissionType === 'PERCENTAGE') {
      commissionData.value = parseFloat(percentageValue) || 0;
    } else if (commissionType === 'TIER') {
      commissionData.tiers = tiers;
    }
    
    // Si on édite, inclure l'ID existant
    if (isEditing && commissionParams && commissionParams.id) {
      commissionData.id = commissionParams.id;
    }
    
    // Simuler un appel API
    setTimeout(() => {
      setLoading(false);
      
      Alert.alert(
        "Succès",
        isEditing
          ? "Les paramètres de commission ont été mis à jour avec succès."
          : "Les paramètres de commission ont été créés avec succès.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  const handleToggleStatus = () => {
    setIsActive(!isActive);
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";
    return numValue.toLocaleString('fr-FR');
  };

  // Formatage du titre en fonction du type d'entité
  const getTitle = () => {
    if (entityType === 'client') {
      return `Commissions - ${entityName || 'Client'}`;
    } else if (entityType === 'collecteur') {
      return `Commissions - ${entityName || 'Collecteur'}`;
    } else if (entityType === 'agence') {
      return `Commissions - ${entityName || 'Agence'}`;
    }
    return "Paramètres de commission";
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={getTitle()}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.loadingContainer]}>
          <Text style={styles.loadingText}>Chargement des paramètres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={getTitle()}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.content}>
          <View style={styles.contentContainer}>
            <Card style={styles.card}>
              <View style={styles.statusContainer}>
                <Text style={styles.sectionTitle}>Statut</Text>
                <TouchableOpacity
                  style={[
                    styles.statusToggle,
                    isActive ? styles.statusActive : styles.statusInactive
                  ]}
                  onPress={handleToggleStatus}
                >
                  <View style={[
                    styles.statusIndicator,
                    isActive ? styles.indicatorActive : styles.indicatorInactive
                  ]} />
                  <Text style={[
                    styles.statusText,
                    isActive ? styles.textActive : styles.textInactive
                  ]}>
                    {isActive ? 'Actif' : 'Inactif'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.sectionTitle}>Type de commission</Text>
              
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    commissionType === 'FIXED' && styles.selectedType
                  ]}
                  onPress={() => handleSelectType('FIXED')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={commissionType === 'FIXED' ? theme.colors.white : theme.colors.primary}
                  />
                  <Text style={[
                    styles.typeText,
                    commissionType === 'FIXED' && styles.selectedTypeText
                  ]}>
                    Montant fixe
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    commissionType === 'PERCENTAGE' && styles.selectedType
                  ]}
                  onPress={() => handleSelectType('PERCENTAGE')}
                >
                  <Ionicons
                    name="trending-up-outline"
                    size={24}
                    color={commissionType === 'PERCENTAGE' ? theme.colors.white : theme.colors.primary}
                  />
                  <Text style={[
                    styles.typeText,
                    commissionType === 'PERCENTAGE' && styles.selectedTypeText
                  ]}>
                    Pourcentage
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    commissionType === 'TIER' && styles.selectedType
                  ]}
                  onPress={() => handleSelectType('TIER')}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={24}
                    color={commissionType === 'TIER' ? theme.colors.white : theme.colors.primary}
                  />
                  <Text style={[
                    styles.typeText,
                    commissionType === 'TIER' && styles.selectedTypeText
                  ]}>
                    Paliers
                  </Text>
                </TouchableOpacity>
              </View>
              
              {commissionType === 'FIXED' && (
                <View style={styles.configSection}>
                  <Text style={styles.configTitle}>Montant fixe (FCFA)</Text>
                  <View style={styles.fixedInputContainer}>
                    <TextInput
                      style={styles.fixedInput}
                      value={fixedAmount}
                      onChangeText={setFixedAmount}
                      keyboardType="numeric"
                      placeholder="Ex: 1000"
                    />
                    <Text style={styles.currencyText}>FCFA</Text>
                  </View>
                  
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                      Un montant fixe de <Text style={styles.highlightText}>{formatCurrency(fixedAmount)} FCFA</Text> sera prélevé comme commission sur chaque période de calcul.
                    </Text>
                  </View>
                </View>
              )}
              
              {commissionType === 'PERCENTAGE' && (
                <View style={styles.configSection}>
                  <Text style={styles.configTitle}>Pourcentage</Text>
                  <View style={styles.fixedInputContainer}>
                    <TextInput
                      style={styles.fixedInput}
                      value={percentageValue}
                      onChangeText={setPercentageValue}
                      keyboardType="numeric"
                      placeholder="Ex: 5"
                    />
                    <Text style={styles.currencyText}>%</Text>
                  </View>
                  
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                      Un pourcentage de <Text style={styles.highlightText}>{percentageValue}%</Text> sera appliqué au montant total collecté pour calculer la commission.
                    </Text>
                  </View>
                </View>
              )}
              
              {commissionType === 'TIER' && (
                <View style={styles.configSection}>
                  <Text style={styles.configTitle}>Paliers</Text>
                  
                  <View style={styles.tierHeader}>
                    <Text style={[styles.tierHeaderText, styles.tierMin]}>Minimum</Text>
                    <Text style={[styles.tierHeaderText, styles.tierMax]}>Maximum</Text>
                    <Text style={[styles.tierHeaderText, styles.tierRate]}>Taux (%)</Text>
                    <Text style={[styles.tierHeaderText, styles.tierAction]}></Text>
                  </View>
                  
                  {tiers.map((tier, index) => (
                    <View key={tier.id} style={styles.tierRow}>
                      <View style={styles.tierMin}>
                        <TextInput
                          style={styles.tierInput}
                          value={tier.min.toString()}
                          onChangeText={(value) => handleUpdateTier(tier.id, 'min', value)}
                          keyboardType="numeric"
                          editable={index === 0 ? false : true} // Premier palier commence toujours à 0
                        />
                      </View>
                      
                      <View style={styles.tierMax}>
                        <TextInput
                          style={styles.tierInput}
                          value={index === tiers.length - 1 ? '∞' : tier.max.toString()}
                          onChangeText={(value) => handleUpdateTier(tier.id, 'max', value)}
                          keyboardType="numeric"
                          editable={index === tiers.length - 1 ? false : true} // Dernier palier va jusqu'à l'infini
                        />
                      </View>
                      
                      <View style={styles.tierRate}>
                        <TextInput
                          style={styles.tierInput}
                          value={tier.rate.toString()}
                          onChangeText={(value) => handleUpdateTier(tier.id, 'rate', value)}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <TouchableOpacity
                        style={styles.tierAction}
                        onPress={() => handleRemoveTier(tier.id)}
                        disabled={tiers.length <= 1}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color={tiers.length <= 1 ? theme.colors.gray : theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addTierButton}
                    onPress={handleAddTier}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.addTierText}>Ajouter un palier</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                      Le taux de commission varie selon le montant total collecté. Le taux correspondant sera appliqué à l'intégralité de la somme.
                    </Text>
                  </View>
                </View>
              )}
            </Card>
            
            <Button
              title={isEditing ? "Mettre à jour" : "Enregistrer"}
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
            
            <Button
              title="Annuler"
              onPress={() => navigation.goBack()}
              variant="outlined"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 20,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  indicatorActive: {
    backgroundColor: theme.colors.success,
  },
  indicatorInactive: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    paddingRight: 8,
  },
  textActive: {
    color: theme.colors.success,
  },
  textInactive: {
    color: theme.colors.error,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    backgroundColor: 'rgba(1, 71, 169, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedType: {
    backgroundColor: theme.colors.primary,
  },
  typeText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedTypeText: {
    color: theme.colors.white,
  },
  configSection: {
    marginTop: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  fixedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  fixedInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  currencyText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  descriptionBox: {
    backgroundColor: 'rgba(0, 136, 204, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.textDark,
    lineHeight: 20,
  },
  highlightText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  tierHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tierHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textLight,
  },
  tierRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  tierMin: {
    flex: 2,
    marginRight: 8,
  },
  tierMax: {
    flex: 2,
    marginRight: 8,
  },
  tierRate: {
    flex: 1,
    marginRight: 8,
  },
  tierAction: {
    width: 36,
    alignItems: 'center',
  },
  tierInput: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 12,
  },
  addTierText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 20,
  },
});

export default CommissionParametersScreen;