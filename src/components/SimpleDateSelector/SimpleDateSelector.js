// src/components/SimpleDateSelector/SimpleDateSelector.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
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

  const [showInput, setShowInput] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef();

  const handleDateChange = (value) => {
    if (value) {
      const selectedDate = new Date(value);
      if (!isNaN(selectedDate.getTime())) {
        onDateChange(selectedDate);
      }
    }
    setShowInput(false);
  };

  const handlePress = () => {
    if (Platform.OS === 'web') {
      setShowInput(true);
      setTempValue(date ? date.toISOString().split('T')[0] : '');
      // Focus sur l'input après un court délai
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      // Pour mobile, utiliser un simple input
      setShowInput(true);
      setTempValue(date ? date.toISOString().split('T')[0] : '');
    }
  };

  if (showInput) {
    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.dateInput, error && styles.dateInputError]}
            value={tempValue}
            onChangeText={setTempValue}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={() => handleDateChange(tempValue)}
            onBlur={() => setShowInput(false)}
            autoFocus={Platform.OS !== 'web'}
            {...(Platform.OS === 'web' && { type: 'date' })}
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleDateChange(tempValue)}
          >
            <Icon name="check" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.dateButton, error && styles.dateButtonError]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.dateContent}>
          <Text style={[styles.dateText, !date && styles.placeholderText]}>
            {date ? formatDate(date) : placeholder}
          </Text>
          <Icon name="calendar-today" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    minHeight: 48
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text
  },
  dateInputError: {
    borderColor: colors.error
  },
  confirmButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.border
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4
  }
});