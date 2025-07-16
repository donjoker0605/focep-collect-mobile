// src/components/Commission/CommissionParametersForm.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Components
import { Input, SelectInput, Button } from '../../../components';
import Card from '../../Card/Card';
import theme from '../../../theme';

// Validation schema
const schema = yup.object().shape({
  type: yup
    .string()
    .oneOf(['FIXED', 'PERCENTAGE', 'TIER'], 'Type de commission invalide')
    .required('Le type de commission est requis'),
  valeur: yup.number().when('type', {
    is: (val) => val === 'FIXED' || val === 'PERCENTAGE',
    then: yup
      .number()
      .required('La valeur est requise')
      .min(0, 'La valeur ne peut pas être négative')
      .typeError('La valeur doit être un nombre'),
    otherwise: yup.number().notRequired(),
  }),
  entityType: yup
    .string()
    .oneOf(['client', 'collecteur', 'agence'], 'Type d\'entité invalide')
    .required('Le type d\'entité est requis'),
  entityId: yup
    .number()
    .nullable()
    .when('entityType', {
      is: (val) => val !== 'default',
      then: yup.number().required('ID de l\'entité requis'),
      otherwise: yup.number().notRequired(),
    }),
  isActive: yup.boolean().required('Le statut est requis'),
});

const CommissionParametersForm = ({
  initialValues = {
    type: 'PERCENTAGE',
    valeur: 5,
    paliers: [],
    entityType: 'client',
    entityId: null,
    isActive: true,
  },
  clientOptions = [],
  collecteurOptions = [],
  agenceOptions = [],
  onSubmit,
  loading = false,
  isEditMode = false,
  onNavigateToPaliers,
}) => {
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...initialValues,
      valeur: initialValues.type === 'PERCENTAGE' ? initialValues.valeur * 100 : initialValues.valeur,
    },
  });

  const commissionType = watch('type');
  const entityType = watch('entityType');
  
  // Gérer le changement de type de commission
  useEffect(() => {
    if (commissionType === 'PERCENTAGE' && !watch('valeur')) {
      setValue('valeur', 5); // Valeur par défaut pour le pourcentage
    } else if (commissionType === 'FIXED' && !watch('valeur')) {
      setValue('valeur', 1000); // Valeur par défaut pour le montant fixe
    }
  }, [commissionType, setValue, watch]);
  
  // Fonction pour soumettre le formulaire
  const onFormSubmit = (data) => {
    // Convertir la valeur de pourcentage (5% -> 0.05)
    const formattedData = {
      ...data,
      valeur: data.type === 'PERCENTAGE' ? data.valeur / 100 : data.valeur,
      paliers: initialValues.paliers || [],
    };
    
    onSubmit(formattedData);
  };
  
  // Désactiver le formulaire pendant le chargement
  const isFormDisabled = loading;
  
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Type de commission</Text>
        
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Type de commission"
              value={value}
              onChange={onChange}
              options={[
                { label: 'Montant fixe', value: 'FIXED' },
                { label: 'Pourcentage', value: 'PERCENTAGE' },
                { label: 'Paliers', value: 'TIER' }
              ]}
              error={errors.type?.message}
              disabled={isFormDisabled}
              style={styles.input}
            />
          )}
        />
        
        {commissionType === 'FIXED' && (
            <Controller
            control={control}
            name="valeur"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Montant fixe (FCFA)"
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                keyboardType="numeric"
                error={errors.valeur?.message}
                disabled={isFormDisabled}
                style={styles.input}
                suffix="FCFA"
              />
            )}
          />
        )}
        
        {commissionType === 'PERCENTAGE' && (
          <Controller
            control={control}
            name="valeur"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Pourcentage (%)"
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                keyboardType="numeric"
                error={errors.valeur?.message}
                disabled={isFormDisabled}
                style={styles.input}
                suffix="%"
              />
            )}
          />
        )}
        
        {commissionType === 'TIER' && (
          <View style={styles.paliersContainer}>
            <Text style={styles.paliersDescription}>
              Cette méthode permet de définir différents taux de commission en fonction 
              des montants collectés. Configurez les paliers pour spécifier les seuils et 
              taux correspondants.
            </Text>
            
            <Button
              title={`${initialValues.paliers?.length > 0 ? 'Modifier' : 'Configurer'} les paliers`}
              onPress={onNavigateToPaliers}
              icon="layers-outline"
              style={styles.paliersButton}
              disabled={isFormDisabled}
            />
            
            {initialValues.paliers?.length > 0 && (
              <View style={styles.paliersPreview}>
                <Text style={styles.paliersPreviewTitle}>
                  {initialValues.paliers.length} palier(s) configuré(s)
                </Text>
                
                {initialValues.paliers.map((palier, index) => (
                  <View key={index} style={styles.palierPreviewItem}>
                    <Text style={styles.palierPreviewText}>
                      {palier.min.toLocaleString()} - {palier.max === 999999999 ? "∞" : palier.max.toLocaleString()} FCFA: {palier.rate}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </Card>
      
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Application</Text>
        
        <Controller
          control={control}
          name="entityType"
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Appliquer à"
              value={value}
              onChange={(newValue) => {
                onChange(newValue);
                setValue('entityId', null); // Réinitialiser l'entité sélectionnée
              }}
              options={[
                { label: 'Client spécifique', value: 'client' },
                { label: 'Collecteur spécifique', value: 'collecteur' },
                { label: 'Agence spécifique', value: 'agence' }
              ]}
              error={errors.entityType?.message}
              disabled={isFormDisabled}
              style={styles.input}
            />
          )}
        />
        
        {entityType === 'client' && clientOptions.length > 0 && (
          <Controller
            control={control}
            name="entityId"
            render={({ field: { onChange, value } }) => (
              <SelectInput
                label="Sélectionner un client"
                value={value}
                onChange={onChange}
                options={clientOptions}
                error={errors.entityId?.message}
                disabled={isFormDisabled}
                style={styles.input}
                searchable
                placeholder="Rechercher un client..."
              />
            )}
          />
        )}
        
        {entityType === 'collecteur' && collecteurOptions.length > 0 && (
          <Controller
            control={control}
            name="entityId"
            render={({ field: { onChange, value } }) => (
              <SelectInput
                label="Sélectionner un collecteur"
                value={value}
                onChange={onChange}
                options={collecteurOptions}
                error={errors.entityId?.message}
                disabled={isFormDisabled}
                style={styles.input}
                searchable
                placeholder="Rechercher un collecteur..."
              />
            )}
          />
        )}
        
        {entityType === 'agence' && agenceOptions.length > 0 && (
          <Controller
            control={control}
            name="entityId"
            render={({ field: { onChange, value } }) => (
              <SelectInput
                label="Sélectionner une agence"
                value={value}
                onChange={onChange}
                options={agenceOptions}
                error={errors.entityId?.message}
                disabled={isFormDisabled}
                style={styles.input}
              />
            )}
          />
        )}
        
        <Controller
          control={control}
          name="isActive"
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Statut"
              value={value}
              onChange={onChange}
              options={[
                { label: 'Actif', value: true },
                { label: 'Inactif', value: false }
              ]}
              error={errors.isActive?.message}
              disabled={isFormDisabled}
              style={styles.input}
            />
          )}
        />
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button
          title={isEditMode ? "Mettre à jour" : "Enregistrer"}
          onPress={handleSubmit(onFormSubmit)}
          loading={loading}
          disabled={isFormDisabled}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  paliersContainer: {
    marginTop: 8,
  },
  paliersDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  paliersButton: {
    marginBottom: 16,
  },
  paliersPreview: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  paliersPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  palierPreviewItem: {
    paddingVertical: 4,
  },
  palierPreviewText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  buttonContainer: {
    marginVertical: 24,
  },
  submitButton: {
    marginBottom: 8,
  },
});

export default CommissionParametersForm;