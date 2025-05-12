// src/components/TransactionItem/EnhancedTransactionItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card/Card';
import theme from '../../theme';

const EnhancedTransactionItem = ({
  // Données de transaction
  id,
  type,
  date,
  amount,
  isIncome = false,
  status = 'completed', // completed, pending, failed
  clientInfo,
  description,
  reference,
  
  // Props UI
  showDetails = false,
  showClient = false,
  showStatus = true,
  showAvatar = false,
  iconName,
  backgroundColor,
  
  // Actions
  onPress,
  onLongPress,
  style,
}) => {
  // Détermine l'icône et la couleur en fonction du type et statut
  const getIconConfig = () => {
    // Config par défaut
    let config = {
      name: iconName || (isIncome ? 'arrow-down-circle' : 'arrow-up-circle'),
      color: isIncome ? theme.colors.info : theme.colors.primary,
      background: `${isIncome ? theme.colors.info : theme.colors.primary}20`
    };
    
    // Surcharge pour certains types
    if (type === 'Épargne') {
      config.name = iconName || 'arrow-down-circle';
      config.color = theme.colors.info;
      config.background = `${theme.colors.info}20`;
    } else if (type === 'Retrait') {
      config.name = iconName || 'arrow-up-circle';
      config.color = theme.colors.error;
      config.background = `${theme.colors.error}20`;
    } else if (type === 'Commission') {
      config.name = iconName || 'wallet';
      config.color = theme.colors.success;
      config.background = `${theme.colors.success}20`;
    }
    
    // Surcharge pour les statuts
    if (status === 'pending') {
      config.name = 'time';
      config.color = theme.colors.warning;
      config.background = `${theme.colors.warning}20`;
    } else if (status === 'failed') {
      config.name = 'close-circle';
      config.color = theme.colors.error;
      config.background = `${theme.colors.error}20`;
    }
    
    return config;
  };
  
  // Format currency avec espace comme séparateur des milliers
  const formatCurrency = (value) => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  // Détermine le statut avec texte et couleur
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { text: 'En attente', color: theme.colors.warning };
      case 'failed':
        return { text: 'Échoué', color: theme.colors.error };
      case 'completed':
      default:
        return { text: 'Complété', color: theme.colors.success };
    }
  };
  
  const iconConfig = getIconConfig();
  const statusConfig = getStatusConfig();
  
  // Créer les initiales pour l'avatar
  const getInitials = () => {
    if (!clientInfo || !clientInfo.prenom || !clientInfo.nom) return '??';
    return `${clientInfo.prenom.charAt(0)}${clientInfo.nom.charAt(0)}`.toUpperCase();
  };

  return (
    <Card 
      style={[styles.container, style]} 
      onPress={onPress}
      elevation={1}
    >
      <View style={styles.mainRow}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: backgroundColor || iconConfig.background }
        ]}>
          <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.type} numberOfLines={1}>
              {type}
            </Text>
            {showStatus && (
              <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.text}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.date}>{date}</Text>
          
          {showClient && clientInfo && (
            <View style={styles.clientRow}>
              {showAvatar && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              )}
              <Text style={styles.clientName}>
                {clientInfo.prenom} {clientInfo.nom}
              </Text>
            </View>
          )}
          
          {description && showDetails && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount,
            isIncome ? styles.incomeAmount : styles.expenseAmount
          ]}>
            {isIncome ? '+' : '-'} {formatCurrency(amount)}
          </Text>
          <Text style={styles.currency}>FCFA</Text>
        </View>
      </View>
      
      {showDetails && reference && (
        <View style={styles.detailsContainer}>
          <Text style={styles.referenceLabel}>Référence:</Text>
          <Text style={styles.referenceValue}>{reference}</Text>
        </View>
      )}
      
      {onLongPress && (
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={onLongPress}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.gray} />
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  type: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  clientName: {
    fontSize: 12,
    color: theme.colors.text,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
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
  currency: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    flexDirection: 'row',
  },
  referenceLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginRight: 8,
  },
  referenceValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  moreButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
});

export default EnhancedTransactionItem;