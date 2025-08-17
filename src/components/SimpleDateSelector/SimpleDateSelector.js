// src/components/SimpleDateSelector/SimpleDateSelector.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import colors from '../../theme/colors';

/**
 * Composant sélecteur de date simplifié et compatible React Native Web
 */
export default function SimpleDateSelector({
  date,
  onDateChange,
  minimumDate,
  maximumDate,
  style,
  label,
  placeholder = 'Sélectionner une date',
  error
}) {
  const formatDate = (date) => {
    if (!date) return '';
    
    // Format FR: DD/MM/YYYY
    return date.toLocaleDateString('fr-FR');
  };

  const handlePress = () => {
    if (Platform.OS === 'web') {
      // Sur le web, utiliser input type="date"
      const input = document.createElement('input');
      input.type = 'date';
      input.value = date ? date.toISOString().split('T')[0] : '';
      input.min = minimumDate ? minimumDate.toISOString().split('T')[0] : '';
      input.max = maximumDate ? maximumDate.toISOString().split('T')[0] : '';
      
      input.onchange = (e) => {
        if (e.target.value) {
          const selectedDate = new Date(e.target.value);
          onDateChange(selectedDate);
        }
      };
      
      input.click();
    } else {
      // Pour mobile, on peut utiliser un prompt simple ou une modal
      const dateString = prompt('Entrez la date (YYYY-MM-DD):', 
        date ? date.toISOString().split('T')[0] : '');
      
      if (dateString) {
        const selectedDate = new Date(dateString);
        if (!isNaN(selectedDate.getTime())) {
          onDateChange(selectedDate);
        }
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          error && styles.dateButtonError
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.dateContent}>
          <Text style={[
            styles.dateText,
            !date && styles.placeholderText
          ]}>
            {date ? formatDate(date) : placeholder}
          </Text>
          <Icon 
            name="calendar-today" 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    padding: 12,
    minHeight: 48
  },
  dateButtonError: {
    borderColor: colors.error
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    flex: 1
  },
  placeholderText: {
    color: colors.textSecondary
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4
  }
});