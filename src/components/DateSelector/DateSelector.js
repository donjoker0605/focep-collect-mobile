// src/components/DateSelector/DateSelector.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from '../DatePicker/DatePicker';
import theme from '../../theme';

/**
 * Composant DateSelector - wrapper simple autour du DatePicker
 * 
 * @param {Date} date - Date actuellement sélectionnée
 * @param {Function} onDateChange - Fonction appelée lors du changement de date
 * @param {string} placeholder - Texte de placeholder
 * @param {boolean} disabled - Si le composant est désactivé
 * @param {Date} minimumDate - Date minimum autorisée
 * @param {Date} maximumDate - Date maximum autorisée
 * @param {string} mode - Mode du picker ('date', 'time', 'datetime')
 * @param {Object} style - Styles supplémentaires
 */
const DateSelector = ({
  date,
  onDateChange,
  placeholder = "Sélectionner une date",
  disabled = false,
  minimumDate,
  maximumDate,
  mode = 'date',
  style,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (newDate) => {
    onDateChange(newDate);
    setShowPicker(false);
  };

  const handleClosePicker = () => {
    setShowPicker(false);
  };

  const getDisplayText = () => {
    if (date) {
      return format(date, 'dd MMMM yyyy', { locale: fr });
    }
    return placeholder;
  };

  const getFormattedDate = () => {
    if (!date) return null;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Comparaison des dates (ignorer l'heure)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Aujourd'hui";
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Hier";
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return "Demain";
    }
    
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dateSelector,
          disabled && styles.dateSelectorDisabled,
          style
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <View style={styles.dateContent}>
          <View style={styles.dateTextContainer}>
            <Text style={[
              styles.dateText,
              !date && styles.placeholderText
            ]}>
              {getFormattedDate() || placeholder}
            </Text>
            
            {date && (
              <Text style={styles.dateSubtext}>
                {format(date, 'EEEE', { locale: fr })}
              </Text>
            )}
          </View>
          
          <View style={styles.dateIcon}>
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={disabled ? theme.colors.textLight : theme.colors.primary} 
            />
          </View>
        </View>
      </TouchableOpacity>

      {showPicker && (
        <DatePicker
          date={date || new Date()}
          onDateChange={handleDateChange}
          onClose={handleClosePicker}
          mode={mode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  dateSelector: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateSelectorDisabled: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.6,
  },
  dateContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    color: theme.colors.textLight,
    fontWeight: 'normal',
  },
  dateSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dateIcon: {
    marginLeft: 8,
  },
});

export default DateSelector;