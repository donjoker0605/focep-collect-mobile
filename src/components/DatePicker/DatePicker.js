// src/components/DatePicker/DatePicker.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';

const { width } = Dimensions.get('window');

const DatePicker = ({ 
  date, 
  onDateChange, 
  onClose, 
  mode = 'date',
  minimumDate,
  maximumDate 
}) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [tempDate, setTempDate] = useState({
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  });

  // Génération des options pour chaque sélecteur
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const generateDayOptions = () => {
    const daysInMonth = getDaysInMonth(tempDate.month, tempDate.year);
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const generateMonthOptions = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push({ 
        value: i, 
        label: format(new Date(2024, i - 1, 1), 'MMMM', { locale: fr }) 
      });
    }
    return months;
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const handleDateChange = () => {
    try {
      const newDate = new Date(tempDate.year, tempDate.month - 1, tempDate.day);
      
      // Validation de la date
      if (isNaN(newDate.getTime())) {
        Alert.alert('Erreur', 'Date invalide');
        return;
      }
      
      // Ajuster le jour si nécessaire (ex: 31 février devient 28/29 février)
      if (newDate.getDate() !== tempDate.day) {
        const adjustedDay = getDaysInMonth(tempDate.month, tempDate.year);
        const adjustedDate = new Date(tempDate.year, tempDate.month - 1, adjustedDay);
        setTempDate(prev => ({ ...prev, day: adjustedDay }));
        onDateChange(adjustedDate);
      } else {
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
      }
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection de la date');
    }
  };

  const handleCancel = () => {
    // Remettre la date originale
    setTempDate({
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear()
    });
    onClose();
  };

  const PickerColumn = ({ title, options, selectedValue, onValueChange, renderOption }) => (
    <View style={styles.pickerColumn}>
      <Text style={styles.pickerTitle}>{title}</Text>
      <ScrollView 
        style={styles.pickerScrollView}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option, index) => {
          const value = typeof option === 'object' ? option.value : option;
          const label = typeof option === 'object' ? option.label : option.toString();
          const isSelected = value === selectedValue;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
              onPress={() => onValueChange(value)}
            >
              <Text style={[
                styles.pickerOptionText, 
                isSelected && styles.pickerOptionTextSelected
              ]}>
                {renderOption ? renderOption(option) : label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une date</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Date actuelle sélectionnée */}
          <View style={styles.currentDateContainer}>
            <Text style={styles.currentDateText}>
              {format(new Date(tempDate.year, tempDate.month - 1, tempDate.day), 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>

          {/* Sélecteurs */}
          <View style={styles.pickersContainer}>
            <PickerColumn
              title="Jour"
              options={generateDayOptions()}
              selectedValue={tempDate.day}
              onValueChange={(day) => setTempDate(prev => ({ ...prev, day }))}
              renderOption={(option) => option.toString().padStart(2, '0')}
            />
            
            <PickerColumn
              title="Mois"
              options={generateMonthOptions()}
              selectedValue={tempDate.month}
              onValueChange={(month) => setTempDate(prev => ({ ...prev, month }))}
            />
            
            <PickerColumn
              title="Année"
              options={generateYearOptions()}
              selectedValue={tempDate.year}
              onValueChange={(year) => setTempDate(prev => ({ ...prev, year }))}
            />
          </View>

          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleDateChange}
            >
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
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
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
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
  currentDateContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
  },
  currentDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  pickerScrollView: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.lightGray,
  },
  pickerOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  pickerOptionTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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