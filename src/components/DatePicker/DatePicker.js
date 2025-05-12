// src/components/DatePicker/DatePicker.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';

/**
 * Composant DatePicker personnalisé
 * @param {Object} props - Propriétés du composant
 * @param {string} props.label - Libellé du champ
 * @param {Date|string} props.value - Date sélectionnée
 * @param {Function} props.onChange - Fonction appelée lors du changement de date
 * @param {string} props.placeholder - Texte affiché quand aucune date n'est sélectionnée
 * @param {string} props.format - Format d'affichage de la date (par défaut: 'dd/MM/yyyy')
 * @param {boolean} props.disabled - Désactive le composant
 * @param {string} props.error - Message d'erreur à afficher
 * @param {Object} props.style - Styles supplémentaires pour le conteneur
 * @param {boolean} props.required - Indique si le champ est requis
 */
const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  format: dateFormat = 'dd/MM/yyyy',
  disabled = false,
  error,
  style,
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Convertir la valeur en Date si c'est une chaîne
  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(date, dateFormat, { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };
  
  const handleDateSelect = (date) => {
    const selectedDate = new Date(date.timestamp);
    onChange(selectedDate);
    setModalVisible(false);
  };
  
  const toggleModal = () => {
    if (!disabled) {
      setModalVisible(!modalVisible);
    }
  };
  
  // Formater la date courante pour le composant Calendar
  const getCurrentDate = () => {
    if (!dateValue) return {};
    
    const formattedDate = format(dateValue, 'yyyy-MM-dd');
    
    return {
      [formattedDate]: {
        selected: true,
        selectedColor: theme.colors.primary,
      }
    };
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
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
        onPress={toggleModal}
        disabled={disabled}
      >
        <Text
          style={[
            styles.dateText,
            !dateValue && styles.placeholderText,
          ]}
        >
          {dateValue ? formatDate(dateValue) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une date</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getCurrentDate()}
              firstDay={1} // Commencer par lundi
              enableSwipeMonths={true}
              hideExtraDays={true}
              theme={{
                calendarBackground: theme.colors.white,
                textSectionTitleColor: theme.colors.textLight,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.white,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.gray,
                dotColor: theme.colors.primary,
                selectedDotColor: theme.colors.white,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.text,
                indicatorColor: theme.colors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500'
              }}
            />
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              {dateValue && (
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => {
                    onChange(new Date());
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.todayButtonText}>Aujourd'hui</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    backgroundColor: theme.colors.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.7,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.gray,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  todayButton: {
    padding: 10,
  },
  todayButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default DatePicker;