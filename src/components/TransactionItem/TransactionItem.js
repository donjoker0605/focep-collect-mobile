// src/components/TransactionItem/TransactionItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const TransactionItem = ({
  type,
  date,
  category,
  amount,
  isIncome = false,
  icon = isIncome ? 'arrow-down-circle' : 'arrow-up-circle',
  onPress,
}) => {
  // Format currency
  const formatCurrency = (value) => {
    return `${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        isIncome ? styles.incomeIcon : styles.expenseIcon
      ]}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
      
      <View style={styles.details}>
        <Text style={styles.type}>{type}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryText}>{category}</Text>
      </View>
      
      <Text 
        style={[
          styles.amount,
          isIncome ? styles.incomeAmount : styles.expenseAmount
        ]}
      >
        {isIncome ? '' : '-'}{formatCurrency(amount)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: theme.colors.info,
  },
  expenseIcon: {
    backgroundColor: theme.colors.primary,
  },
  details: {
    flex: 1,
  },
  type: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  categoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.lightGray,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: theme.colors.info,
  },
  expenseAmount: {
    color: theme.colors.error,
  },
});

export default TransactionItem;