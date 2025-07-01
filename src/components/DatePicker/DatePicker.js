// src/components/DatePicker/DatePicker.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const DatePicker = ({ 
  date, 
  onDateChange, 
  onClose, 
  mode = 'date',
  minimumDate,
  maximumDate 
}) => {
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      onClose();
    }
    
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelButton}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Sélectionner une date</Text>
              <TouchableOpacity onPress={() => onDateChange(date)}>
                <Text style={styles.doneButton}>Valider</Text>
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={date}
              mode={mode}
              display="spinner"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale="fr-FR"
            />
          </View>
        </View>
      </Modal>
    );
  }

  // Android
  return (
    <DateTimePicker
      value={date}
      mode={mode}
      display="default"
      onChange={handleDateChange}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
    />
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  doneButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default DatePicker;