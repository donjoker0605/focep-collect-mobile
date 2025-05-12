// src/components/AmountInput/AmountInput.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

/**
 * Composant de saisie de montant financier
 * 
 * @param {Object} props Les propriétés du composant
 * @param {string} props.value Valeur du montant
 * @param {Function} props.onChangeText Fonction appelée lors de la modification du montant
 * @param {string} props.label Libellé du champ
 * @param {string} props.placeholder Texte affiché si aucun montant n'est saisi
 * @param {string} props.prefix Préfixe affiché avant le montant
 * @param {string} props.suffix Suffixe affiché après le montant (ex: "FCFA")
 * @param {boolean} props.required Indique si le champ est obligatoire
 * @param {string} props.error Message d'erreur
 * @param {boolean} props.disableDecimal Désactive la saisie de décimales
 * @param {number} props.maxValue Valeur maximale autorisée
 * @param {number} props.minValue Valeur minimale autorisée
 * @param {boolean} props.showFormatted Affiche le montant formaté pendant la saisie
 * @param {Object} props.style Styles supplémentaires
 */
const AmountInput = ({
  value = '',
  onChangeText,
  label,
  placeholder = 'Saisir un montant',
  prefix,
  suffix = 'FCFA',
  required = false,
  error,
  disableDecimal = false,
  maxValue,
  minValue = 0,
  showFormatted = true,
  editable = true,
  style,
}) => {
  // État pour le montant
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Mettre à jour l'affichage du montant
  useEffect(() => {
    if (value === '') {
      setDisplayValue('');
    } else if (isFocused) {
      // Pendant la saisie, on affiche le montant non formaté
      setDisplayValue(value);
    } else if (showFormatted) {
      // Sinon, on affiche le montant formaté
      const numValue = parseFloat(value) || 0;
      setDisplayValue(formatCurrency(numValue, false, disableDecimal ? 0 : 2));
    } else {
      setDisplayValue(value);
    }
  }, [value, isFocused, showFormatted, disableDecimal]);
  
  // Gérer la saisie du montant
  const handleChangeText = (text) => {
    // Nettoyer l'entrée (enlever les espaces, les virgules, etc.)
    let cleanText = text.replace(/[^\d.]/g, '');
    
    // Si les décimales sont désactivées, supprimer tout ce qui suit le point
    if (disableDecimal) {
      cleanText = cleanText.split('.')[0];
    } else {
      // Sinon, s'assurer qu'il n'y a qu'un seul point
      const parts = cleanText.split('.');
      if (parts.length > 2) {
        cleanText = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    // Limiter à 2 décimales
    if (!disableDecimal && cleanText.includes('.')) {
      const parts = cleanText.split('.');
      cleanText = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Vérifier la valeur maximale
    if (maxValue !== undefined) {
      const numValue = parseFloat(cleanText);
      if (numValue > maxValue) {
        cleanText = maxValue.toString();
      }
    }
    
    // Vérifier la valeur minimale
    if (minValue !== undefined) {
      const numValue = parseFloat(cleanText);
      if (numValue < minValue && numValue !== 0) {
        cleanText = minValue.toString();
      }
    }
    
    // Mettre à jour la valeur
    onChangeText(cleanText);
  };
  
  // Gérer le focus
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  // Gérer la perte de focus
  const handleBlur = () => {
    setIsFocused(false);
    
    // Formater le montant si nécessaire
    if (value && showFormatted) {
      const numValue = parseFloat(value) || 0;
      setDisplayValue(formatCurrency(numValue, false, disableDecimal ? 0 : 2));
    }
  };
  
  // Effacer le champ
  const handleClear = () => {
    onChangeText('');
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        </View>
      )}
      
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {prefix && (
          <Text style={styles.prefix}>{prefix}</Text>
        )}
        
        <TextInput
          style={styles.input}
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray}
          keyboardType="numeric"
          editable={editable}
        />
        
        {suffix && (
          <Text style={styles.suffix}>{suffix}</Text>
        )}
        
        {value !== '' && editable && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  requiredAsterisk: {
    color: theme.colors.error,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 8,
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: 16,
    height: 50,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.7,
  },
  prefix: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 8,
  },
  suffix: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default AmountInput;