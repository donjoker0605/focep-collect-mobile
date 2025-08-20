// src/components/CommissionForm/CommissionForm.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../Card/Card';
import SimpleInput from '../SimpleInput/SimpleInput';
import SelectInput from '../SelectInput/SelectInput';

import colors from '../../theme/colors';

// Types de commission
const COMMISSION_TYPES = [
  { label: 'Montant fixe', value: 'MONTANT_FIXE' },
  { label: 'Pourcentage', value: 'POURCENTAGE' },
  { label: 'Par paliers', value: 'PALIERS' },
];

/**
 * Composant simplifié pour la configuration de commission de l'agence
 */
export default function CommissionForm({
  commissionConfig = { type: 'MONTANT_FIXE', valeur: '', valeurMax: '', paliers: [] },
  onCommissionConfigChange,
  editable = true,
  style
}) {

  const updateCommissionType = (type) => {
    onCommissionConfigChange({
      ...commissionConfig,
      type,
      valeur: type === 'PALIERS' ? '' : commissionConfig.valeur,
      paliers: type === 'PALIERS' ? (commissionConfig.paliers.length > 0 ? commissionConfig.paliers : [
        { montantMin: 0, montantMax: 1000, taux: 5 },
        { montantMin: 1001, montantMax: 5000, taux: 4 },
        { montantMin: 5001, montantMax: null, taux: 3 }
      ]) : []
    });
  };

  const updateCommissionValue = (valeur) => {
    onCommissionConfigChange({
      ...commissionConfig,
      valeur: parseFloat(valeur) || 0
    });
  };

  const updateCommissionMaxValue = (valeurMax) => {
    onCommissionConfigChange({
      ...commissionConfig,
      valeurMax: parseFloat(valeurMax) || null
    });
  };

  const addPalier = () => {
    const lastPalier = commissionConfig.paliers[commissionConfig.paliers.length - 1];
    const newMin = lastPalier?.montantMax ? lastPalier.montantMax + 1 : 5001;
    
    onCommissionConfigChange({
      ...commissionConfig,
      paliers: [...commissionConfig.paliers, { 
        montantMin: newMin, 
        montantMax: null, 
        taux: 3 
      }]
    });
  };

  const updatePalier = (index, field, value) => {
    onCommissionConfigChange({
      ...commissionConfig,
      paliers: commissionConfig.paliers.map((palier, i) => 
        i === index 
          ? { ...palier, [field]: field === 'taux' ? parseFloat(value) || 0 : (value === '' ? null : parseInt(value)) }
          : palier
      )
    });
  };

  const removePalier = (index) => {
    if (commissionConfig.paliers.length <= 1) {
      Alert.alert("Erreur", "Vous devez avoir au moins un palier");
      return;
    }
    
    onCommissionConfigChange({
      ...commissionConfig,
      paliers: commissionConfig.paliers.filter((_, i) => i !== index)
    });
  };

  const getCommissionTypeLabel = (value) => {
    const type = COMMISSION_TYPES.find(t => t.value === value);
    return type?.label || value;
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Configuration de Commission</Text>
      <Text style={styles.description}>
        Définissez le type de commission par défaut pour cette agence.
      </Text>

      <SelectInput
        label="Type de commission"
        value={commissionConfig.type}
        options={COMMISSION_TYPES}
        onChange={updateCommissionType}
        modalTitle="Sélectionner un type de commission"
        disabled={!editable}
      />

      {commissionConfig.type === 'MONTANT_FIXE' && (
        <SimpleInput
          label="Montant fixe (FCFA)"
          value={commissionConfig.valeur?.toString() || ''}
          onChangeText={(value) => onCommissionConfigChange({
            ...commissionConfig,
            valeur: value
          })}
          placeholder="1000"
          keyboardType="numeric"
          suffix="FCFA"
          editable={editable}
        />
      )}

      {commissionConfig.type === 'POURCENTAGE' && (
        <View>
          <SimpleInput
            label="Pourcentage (%)"
            value={commissionConfig.valeur?.toString() || ''}
            onChangeText={(value) => onCommissionConfigChange({
              ...commissionConfig,
              valeur: value
            })}
            placeholder="2.5"
            keyboardType="numeric"
            suffix="%"
            editable={editable}
          />
          
          <SimpleInput
            label="Valeur maximum (optionnel)"
            value={commissionConfig.valeurMax?.toString() || ''}
            onChangeText={(value) => onCommissionConfigChange({
              ...commissionConfig,
              valeurMax: value
            })}
            placeholder="5000"
            keyboardType="numeric"
            suffix="FCFA"
            editable={editable}
          />
        </View>
      )}

      {commissionConfig.type === 'PALIERS' && (
        <View style={styles.paliersSection}>
          <Text style={styles.paliersTitle}>Configuration des paliers</Text>
          
          {commissionConfig.paliers.map((palier, index) => (
            <Card key={index} style={styles.palierCard}>
              <View style={styles.palierHeader}>
                <Text style={styles.palierLabel}>Palier {index + 1}</Text>
                {commissionConfig.paliers.length > 1 && editable && (
                  <TouchableOpacity onPress={() => removePalier(index)}>
                    <Ionicons name="trash" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.palierRow}>
                <View style={styles.palierField}>
                  <SimpleInput
                    label="Min (FCFA)"
                    value={palier.montantMin?.toString() || ''}
                    onChangeText={(text) => updatePalier(index, 'montantMin', text)}
                    keyboardType="numeric"
                    editable={index === 0 ? false : editable}
                  />
                </View>
                
                <View style={styles.palierField}>
                  <SimpleInput
                    label="Max (FCFA)"
                    value={palier.montantMax?.toString() || ''}
                    onChangeText={(text) => updatePalier(index, 'montantMax', text)}
                    keyboardType="numeric"
                    placeholder="Illimité"
                    editable={editable}
                  />
                </View>
                
                <View style={styles.palierField}>
                  <SimpleInput
                    label="Taux (%)"
                    value={palier.taux?.toString() || ''}
                    onChangeText={(text) => updatePalier(index, 'taux', text)}
                    keyboardType="numeric"
                    editable={editable}
                  />
                </View>
              </View>
            </Card>
          ))}

          {editable && (
            <TouchableOpacity style={styles.addPalierButton} onPress={addPalier}>
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text style={styles.addPalierText}>Ajouter un palier</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {commissionConfig.type && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Type sélectionné : {getCommissionTypeLabel(commissionConfig.type)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  paliersSection: {
    marginTop: 16,
  },
  paliersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  palierCard: {
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  palierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  palierLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  palierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  palierField: {
    flex: 1,
  },
  addPalierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  addPalierText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});