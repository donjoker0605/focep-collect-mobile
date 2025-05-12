// src/components/Commission/CommissionParametersForm.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Input, Button } from '../index';
import AmountInput from '../AmountInput/AmountInput';
import SelectInput from '../SelectInput/SelectInput';
import theme from '../../theme';

// Types de méthode de calcul de commission
const COMMISSION_TYPES = [
  { label: 'Montant fixe', value: 'FIXED' },
  { label: 'Pourcentage', value: 'PERCENTAGE' },
  { label: 'Palier', value: 'TIER' },
];

/**
 * Formulaire de configuration des paramètres de commission
 * 
 * @param {Object} props Les propriétés du composant
 * @param {Object} props.initialValues Valeurs initiales des paramètres
 * @param {Function} props.onSubmit Fonction appelée lors de la soumission du formulaire
 * @param {boolean} props.loading État de chargement
 * @param {Object} props.style Styles supplémentaires
 */
const CommissionParametersForm = ({
  initialValues = {
    type: 'PERCENTAGE',
    value: 2,
    tiers: [
      { min: 0, max: 1000, rate: 5 },
      { min: 1001, max: 5000, rate: 4 },
      { min: 5001, max: null, rate: 3 },
    ],
    isActive: true,
    clientId: null,
    collecteurId: null,
    agenceId: null,
  },
  clientOptions = [],
  collecteurOptions = [],
  agenceOptions = [],
  onSubmit,
  loading = false,
  style,
}) => {
  // État du formulaire
  const [formValues, setFormValues] = useState(initialValues);
  
  // Mettre à jour l'état du formulaire quand les valeurs initiales changent
  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);
  
  // Mettre à jour un champ du formulaire
  const updateField = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Ajouter un palier
  const addTier = () => {
    const tiers = [...formValues.tiers];
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier.max !== null ? lastTier.max + 1 : 5001;
    
    tiers.push({ min: newMin, max: null, rate: 3 });
    updateField('tiers', tiers);
  };
  
  // Supprimer un palier
  const removeTier = (index) => {
    if (formValues.tiers.length <= 1) {
      Alert.alert("Erreur", "Vous devez avoir au moins un palier");
      return;
    }
    
    const tiers = [...formValues.tiers];
    tiers.splice(index, 1);
    updateField('tiers', tiers);
  };
  
  // Mettre à jour un palier
  const updateTier = (index, field, value) => {
    const tiers = [...formValues.tiers];
    tiers[index] = {
      ...tiers[index],
      [field]: value === '' ? null : field === 'rate' ? parseFloat(value) : parseInt(value, 10),
    };
    updateField('tiers', tiers);
  };
  
  // Valider le formulaire
  const validateForm = () => {
    // Validation de base
    if (formValues.type === 'FIXED' && (!formValues.value || formValues.value <= 0)) {
      Alert.alert("Erreur", "Le montant fixe doit être supérieur à zéro");
      return false;
    }
    
    if (formValues.type === 'PERCENTAGE' && (formValues.value < 0 || formValues.value > 100)) {
      Alert.alert("Erreur", "Le pourcentage doit être compris entre 0 et 100");
      return false;
    }
    
    if (formValues.type === 'TIER') {
      // Validation des paliers
      for (let i = 0; i < formValues.tiers.length; i++) {
        const tier = formValues.tiers[i];
        
        // Vérifier les bornes
        if (tier.min !== null && tier.max !== null && tier.min >= tier.max) {
          Alert.alert("Erreur", `Palier ${i + 1}: Le montant minimum doit être inférieur au montant maximum`);
          return false;
        }
        
        // Vérifier que le taux est positif
        if (tier.rate < 0 || tier.rate > 100) {
          Alert.alert("Erreur", `Palier ${i + 1}: Le taux doit être compris entre 0 et 100`);
          return false;
        }
        
        // Vérifier la continuité et l'absence de chevauchement
        if (i > 0) {
          const previous = formValues.tiers[i-1];
          if (previous.max !== null && tier.min !== null && previous.max + 1 !== tier.min) {
            Alert.alert("Erreur", `Les paliers ${i} et ${i + 1} ne sont pas continus`);
            return false;
          }
        }
      }
    }
    
    // Validation du niveau d'application
    const hasLevel = formValues.clientId || formValues.collecteurId || formValues.agenceId;
    if (!hasLevel) {
      Alert.alert("Erreur", "Vous devez sélectionner au moins un niveau d'application (client, collecteur ou agence)");
      return false;
    }
    
    return true;
  };
  
  // Soumettre le formulaire
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Créer l'objet de données à envoyer au backend
    const formData = {
      ...formValues,
      // Convertir les valeurs en nombres
      value: parseFloat(formValues.value),
    };
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };
  
  // Rendu du formulaire spécifique au type de commission
  const renderCommissionForm = () => {
    switch (formValues.type) {
      case 'FIXED':
        return (
          <View style={styles.formGroup}>
            <AmountInput
              label="Montant fixe"
              value={formValues.value.toString()}
              onChangeText={(text) => updateField('value', text)}
              suffix="FCFA"
              required
            />
          </View>
        );
      
      case 'PERCENTAGE':
        return (
          <View style={styles.formGroup}>
            <Input
              label="Pourcentage"
              value={formValues.value.toString()}
              onChangeText={(text) => updateField('value', text)}
              keyboardType="numeric"
              suffix="%"
              required
            />
          </View>
        );
      
      case 'TIER':
        return (
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Paliers de commission</Text>
            
            {formValues.tiers.map((tier, index) => (
              <Card 
                key={index} 
                style={styles.tierCard}
                border={true}
              >
                <View style={styles.tierHeader}>
                  <Text style={styles.tierTitle}>Palier {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.removeTierButton}
                    onPress={() => removeTier(index)}
                    disabled={formValues.tiers.length <= 1}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={20} 
                      color={formValues.tiers.length <= 1 ? theme.colors.gray : theme.colors.error} 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.tierRow}>
                  <View style={styles.tierField}>
                    <Input
                      label="Min (FCFA)"
                      value={tier.min !== null ? tier.min.toString() : ''}
                      onChangeText={(text) => updateTier(index, 'min', text)}
                      keyboardType="numeric"
                      disabled={index === 0}
                    />
                  </View>
                  
                  <View style={styles.tierField}>
                    <Input
                      label="Max (FCFA)"
                      value={tier.max !== null ? tier.max.toString() : ''}
                      onChangeText={(text) => updateTier(index, 'max', text)}
                      keyboardType="numeric"
                      placeholder="Illimité"
                    />
                  </View>
                  
                  <View style={styles.tierField}>
                    <Input
                      label="Taux (%)"
                      value={tier.rate.toString()}
                      onChangeText={(text) => updateTier(index, 'rate', text)}
                      keyboardType="numeric"
                      required
                    />
                  </View>
                </View>
              </Card>
            ))}
            
            <TouchableOpacity
              style={styles.addTierButton}
              onPress={addTier}
            >
              <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.addTierText}>Ajouter un palier</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formGroup}>
        <SelectInput
          label="Type de commission"
          value={formValues.type}
          options={COMMISSION_TYPES}
          onChange={(value) => updateField('type', value)}
          required
        />
      </View>
      
      {renderCommissionForm()}
      
      <View style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Niveau d'application</Text>
      <Text style={styles.sectionDescription}>
        Sélectionnez au moins un niveau auquel cette règle de commission s'applique.
        Si plusieurs niveaux sont sélectionnés, l'ordre de priorité sera : Client > Collecteur > Agence.
      </Text>
      
      <View style={styles.formGroup}>
        <SelectInput
          label="Client"
          value={formValues.clientId}
          options={clientOptions}
          onChange={(value) => updateField('clientId', value)}
          placeholder="Sélectionner un client (optionnel)"
          searchable
        />
      </View>
      
      <View style={styles.formGroup}>
        <SelectInput
          label="Collecteur"
          value={formValues.collecteurId}
          options={collecteurOptions}
          onChange={(value) => updateField('collecteurId', value)}
          placeholder="Sélectionner un collecteur (optionnel)"
          searchable
        />
      </View>
      
      <View style={styles.formGroup}>
        <SelectInput
          label="Agence"
          value={formValues.agenceId}
          options={agenceOptions}
          onChange={(value) => updateField('agenceId', value)}
          placeholder="Sélectionner une agence (optionnel)"
          searchable
        />
      </View>
      
      <View style={styles.formGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Activer cette règle de commission</Text>
          <Switch
            value={formValues.isActive}
            onValueChange={(value) => updateField('isActive', value)}
            trackColor={{ false: theme.colors.gray, true: `${theme.colors.primary}80` }}
            thumbColor={formValues.isActive ? theme.colors.primary : '#f4f3f4'}
          />
        </View>
      </View>
      
      <Button
        title="Enregistrer les paramètres"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  tierCard: {
    marginBottom: 12,
    padding: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  removeTierButton: {
    padding: 4,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierField: {
    flex: 1,
    marginHorizontal: 4,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addTierText: {
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default CommissionParametersForm;