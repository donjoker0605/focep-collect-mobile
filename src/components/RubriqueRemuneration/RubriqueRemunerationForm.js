// src/components/RubriqueRemuneration/RubriqueRemunerationForm.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Card from '../Card/Card';
import SimpleInput from '../SimpleInput/SimpleInput';
import Button from '../Button/Button';
import SimpleDateSelector from '../SimpleDateSelector/SimpleDateSelector';
import SelectInput from '../SelectInput/SelectInput';

import colors from '../../theme/colors';
import { formatters } from '../../utils/formatters';

/**
 * Formulaire de création/édition d'une rubrique de rémunération
 */
export default function RubriqueRemunerationForm({
  rubrique = null,
  collecteurs = [],
  onSubmit,
  onCancel,
  loading = false
}) {
  const [formData, setFormData] = useState({
    nom: '',
    type: 'CONSTANT', // CONSTANT ou PERCENTAGE
    valeur: '',
    dateApplication: new Date().toISOString().split('T')[0],
    delaiJours: '',
    collecteurIds: [],
    active: true
  });

  const [errors, setErrors] = useState({});
  const [hasDelai, setHasDelai] = useState(false);

  // Types de rubrique
  const typeOptions = [
    { label: 'Montant Fixe', value: 'CONSTANT' },
    { label: 'Pourcentage de S', value: 'PERCENTAGE' }
  ];

  // Options collecteurs
  const collecteurOptions = collecteurs.map(collecteur => ({
    label: collecteur.nom,
    value: collecteur.id
  }));

  useEffect(() => {
    if (rubrique) {
      setFormData({
        nom: rubrique.nom || '',
        type: rubrique.type || 'CONSTANT',
        valeur: rubrique.valeur?.toString() || '',
        dateApplication: rubrique.dateApplication || new Date().toISOString().split('T')[0],
        delaiJours: rubrique.delaiJours?.toString() || '',
        collecteurIds: rubrique.collecteurIds || [],
        active: rubrique.active !== false
      });
      setHasDelai(!!rubrique.delaiJours);
    } else if (collecteurs.length > 0) {
      // 🔥 FIX: Pour nouvelle rubrique, pré-sélectionner tous les collecteurs disponibles
      setFormData(prev => ({
        ...prev,
        collecteurIds: collecteurs.map(c => c.id)
      }));
    }
  }, [rubrique, collecteurs]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de la rubrique est requis';
    }

    if (!formData.valeur.trim()) {
      newErrors.valeur = 'La valeur est requise';
    } else {
      const value = parseFloat(formData.valeur);
      if (isNaN(value) || value <= 0) {
        newErrors.valeur = 'La valeur doit être un nombre positif';
      } else if (formData.type === 'PERCENTAGE' && value > 100) {
        newErrors.valeur = 'Le pourcentage ne peut pas dépasser 100%';
      }
    }

    if (!formData.dateApplication) {
      newErrors.dateApplication = 'La date d\'application est requise';
    }

    if (hasDelai && formData.delaiJours) {
      const delai = parseInt(formData.delaiJours);
      if (isNaN(delai) || delai <= 0) {
        newErrors.delaiJours = 'Le délai doit être un nombre entier positif';
      }
    }

    if (formData.collecteurIds.length === 0) {
      newErrors.collecteurIds = 'Veuillez sélectionner au moins un collecteur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      valeur: parseFloat(formData.valeur),
      delaiJours: hasDelai && formData.delaiJours ? parseInt(formData.delaiJours) : null
    };

    onSubmit(submissionData);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleCollecteurToggle = (collecteurId) => {
    setFormData(prev => {
      const currentIds = prev.collecteurIds;
      const newIds = currentIds.includes(collecteurId)
        ? currentIds.filter(id => id !== collecteurId)
        : [...currentIds, collecteurId];
      
      return {
        ...prev,
        collecteurIds: newIds
      };
    });
  };

  const getValeurLabel = () => {
    return formData.type === 'CONSTANT' ? 'Montant (FCFA)' : 'Pourcentage (%)';
  };

  const getValeurPlaceholder = () => {
    return formData.type === 'CONSTANT' ? '50000' : '10';
  };

  return (
    <View style={styles.container}>
      <Card style={styles.formCard}>
        <Text style={styles.title}>
          {rubrique ? 'Modifier la Rubrique' : 'Nouvelle Rubrique'}
        </Text>

        {/* Nom de la rubrique */}
        <View style={styles.inputGroup}>
          <SimpleInput
            label="Nom de la Rubrique"
            value={formData.nom}
            onChangeText={(value) => handleFieldChange('nom', value)}
            placeholder="Salaire Base, Prime Performance..."
            error={errors.nom}
            maxLength={100}
            required
          />
        </View>

        {/* Type de rubrique */}
        <View style={styles.inputGroup}>
          <SelectInput
            label="Type de Rubrique"
            value={formData.type}
            options={typeOptions}
            onChange={(value) => handleFieldChange('type', value)}
            error={errors.type}
            modalTitle="Sélectionner le type de rubrique"
          />
        </View>

        {/* Valeur */}
        <View style={styles.inputGroup}>
          <SimpleInput
            label={getValeurLabel()}
            value={formData.valeur}
            onChangeText={(value) => handleFieldChange('valeur', value)}
            placeholder={getValeurPlaceholder()}
            keyboardType="numeric"
            error={errors.valeur}
            suffix={formData.type === 'PERCENTAGE' ? '%' : 'FCFA'}
            required
          />
          {formData.type === 'PERCENTAGE' && (
            <Text style={styles.helpText}>
              Le pourcentage sera appliqué sur le montant S du collecteur
            </Text>
          )}
        </View>

        {/* Date d'application */}
        <View style={styles.inputGroup}>
          <SimpleDateSelector
            label="Date d'Application"
            date={formData.dateApplication ? new Date(formData.dateApplication) : new Date()}
            onDateChange={(date) => handleFieldChange('dateApplication', date.toISOString().split('T')[0])}
            minimumDate={new Date()}
            placeholder="Sélectionner la date d'application"
            error={errors.dateApplication}
          />
        </View>

        {/* Délai en jours */}
        <View style={styles.inputGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Délai d'Application</Text>
            <Switch
              value={hasDelai}
              onValueChange={setHasDelai}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={hasDelai ? colors.primary : colors.textSecondary}
            />
          </View>
          {hasDelai && (
            <View style={styles.delaiInput}>
              <SimpleInput
                value={formData.delaiJours}
                onChangeText={(value) => handleFieldChange('delaiJours', value)}
                placeholder="30"
                keyboardType="numeric"
                error={errors.delaiJours}
                suffix="jours"
              />
              <Text style={styles.helpText}>
                La rubrique sera active pendant ce nombre de jours
              </Text>
            </View>
          )}
          {!hasDelai && (
            <Text style={styles.helpText}>
              Rubrique active indéfiniment
            </Text>
          )}
        </View>

        {/* Collecteurs concernés */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Collecteurs Concernés</Text>
          {errors.collecteurIds && (
            <Text style={styles.errorText}>{errors.collecteurIds}</Text>
          )}
          <View style={styles.collecteursList}>
            {collecteurOptions.map(collecteur => (
              <TouchableOpacity
                key={collecteur.value}
                style={[
                  styles.collecteurItem,
                  formData.collecteurIds.includes(collecteur.value) && styles.collecteurItemSelected
                ]}
                onPress={() => handleCollecteurToggle(collecteur.value)}
              >
                <Icon 
                  name={formData.collecteurIds.includes(collecteur.value) ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={formData.collecteurIds.includes(collecteur.value) ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.collecteurText,
                  formData.collecteurIds.includes(collecteur.value) && styles.collecteurTextSelected
                ]}>
                  {collecteur.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statut actif */}
        <View style={styles.inputGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Rubrique Active</Text>
            <Switch
              value={formData.active}
              onValueChange={(value) => handleFieldChange('active', value)}
              trackColor={{ false: colors.border, true: colors.success + '50' }}
              thumbColor={formData.active ? colors.success : colors.textSecondary}
            />
          </View>
          <Text style={styles.helpText}>
            {formData.active ? 'La rubrique sera appliquée lors des rémunérations' : 'Rubrique désactivée'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button
            title="Annuler"
            onPress={onCancel}
            variant="secondary"
            style={styles.cancelButton}
          />
          <Button
            title={rubrique ? 'Modifier' : 'Créer'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  formCard: {
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic'
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  delaiInput: {
    marginTop: 12
  },
  collecteursList: {
    marginTop: 8
  },
  collecteurItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  collecteurItemSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary
  },
  collecteurText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text
  },
  collecteurTextSelected: {
    color: colors.primary,
    fontWeight: '500'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  cancelButton: {
    flex: 0.45
  },
  submitButton: {
    flex: 0.45
  }
});