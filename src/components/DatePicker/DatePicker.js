// src/components/DatePicker/DatePicker.js


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';

const DatePicker = ({ 
  date, 
  onDateChange, 
  onClose, 
  mode = 'date',
  minimumDate,
  maximumDate 
}) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [showModal, setShowModal] = useState(true);

  // Composant DatePicker simplifié sans dépendances natives
  const SimpleDateInput = () => {
    const [tempDate, setTempDate] = useState({
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear()
    });

    const handleDateChange = () => {
      try {
        const newDate = new Date(tempDate.year, tempDate.month - 1, tempDate.day);
        
        // Validation de la date
        if (isNaN(newDate.getTime())) {
          Alert.alert('Erreur', 'Date invalide');
          return;
        }
        
        // Vérification des limites
        if (minimumDate && newDate < minimumDate) {
          Alert.alert('Erreur', 'Date antérieure à la date minimum autorisée');
          return;
        }
        
        if (maximumDate && newDate > maximumDate) {
          Alert.alert('Erreur', 'Date postérieure à la date maximum autorisée');
          return;
        }
        
        onDateChange(newDate);
        onClose();
      } catch (error) {
        Alert.alert('Erreur', 'Erreur lors de la sélection de la date');
      }
    };

    return (
      <View style={styles.dateInputContainer}>
        <Text style={styles.dateInputLabel}>Jour</Text>
        <TouchableOpacity 
          style={styles.dateInputField}
          onPress={() => showNumberPicker('day', 1, 31, tempDate.day, (value) => setTempDate({...tempDate, day: value}))}
        >
          <Text style={styles.dateInputText}>{tempDate.day.toString().padStart(2, '0')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.dateInputLabel}>Mois</Text>
        <TouchableOpacity 
          style={styles.dateInputField}
          onPress={() => showNumberPicker('month', 1, 12, tempDate.month, (value) => setTempDate({...tempDate, month: value}))}
        >
          <Text style={styles.dateInputText}>{tempDate.month.toString().padStart(2, '0')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.dateInputLabel}>Année</Text>
        <TouchableOpacity 
          style={styles.dateInputField}
          onPress={() => showNumberPicker('year', 1900, 2100, tempDate.year, (value) => setTempDate({...tempDate, year: value}))}
        >
          <Text style={styles.dateInputText}>{tempDate.year}</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.confirmButton} onPress={handleDateChange}>
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const showNumberPicker = (type, min, max, current, onChange) => {
    // Afficher une alerte simple pour la saisie
    const options = [];
    for (let i = min; i <= max; i++) {
      options.push({
        text: i.toString(),
        onPress: () => onChange(i)
      });
    }
    
    // Pour simplifier, on peut utiliser une approche basique
    Alert.prompt(
      `Sélectionner ${type}`,
      `Entrez une valeur entre ${min} et ${max}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num >= min && num <= max) {
              onChange(num);
            } else {
              Alert.alert('Erreur', `Valeur invalide. Entrez un nombre entre ${min} et ${max}`);
            }
          }
        }
      ],
      'plain-text',
      current.toString()
    );
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <SimpleDateInput />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  dateInputContainer: {
    alignItems: 'center',
  },
  dateInputLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
    marginTop: 16,
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  dateInputText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '600',
  },
});

export default DatePicker;