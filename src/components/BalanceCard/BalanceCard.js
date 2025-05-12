// src/components/BalanceCard/BalanceCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card/Card';
import theme from '../../theme';

const BalanceCard = ({
  balance = 0,
  currency = 'FCFA',
  title = 'Solde actuel',
  subtitle,
  showActions = true,
  onAddPress,
  onWithdrawPress,
  onHistoryPress,
  hideBalance = false,
  style,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(hideBalance);
  
  // Formater le montant avec séparateur d'espace pour les milliers
  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  // Activer/désactiver la visibilité du solde
  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };
  
  return (
    <Card 
      style={[styles.container, style]} 
      elevation={2}
      cornerRadius={16}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        
        <TouchableOpacity onPress={toggleBalanceVisibility}>
          <Ionicons
            name={isBalanceHidden ? 'eye-off' : 'eye'}
            size={24}
            color={theme.colors.textLight}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>
          {isBalanceHidden ? '••••••' : formatCurrency(balance)}
        </Text>
        <Text style={styles.currencyText}>{currency}</Text>
      </View>
      
      {showActions && (
        <View style={styles.actionsContainer}>
          {onAddPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onAddPress}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <Ionicons name="arrow-down" size={20} color={theme.colors.info} />
              </View>
              <Text style={styles.actionText}>Dépôt</Text>
            </TouchableOpacity>
          )}
          
          {onWithdrawPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onWithdrawPress}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Ionicons name="arrow-up" size={20} color={theme.colors.error} />
              </View>
              <Text style={styles.actionText}>Retrait</Text>
            </TouchableOpacity>
          )}
          
          {onHistoryPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onHistoryPress}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.gray}20` }]}>
                <Ionicons name="time" size={20} color={theme.colors.gray} />
              </View>
              <Text style={styles.actionText}>Historique</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  balanceContainer: {
    marginBottom: 16,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  currencyText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.text,
  },
});

export default BalanceCard;