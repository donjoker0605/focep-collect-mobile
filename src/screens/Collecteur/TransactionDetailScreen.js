// src/screens/Collecteur/TransactionDetailScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Share, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../hooks/useAuth';
import { transactionService } from '../../services';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, formatTime } from '../../utils/dateUtils';

const TransactionDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { transaction: initialTransaction, transactionId } = route.params || {};
  
  const [transaction, setTransaction] = useState(initialTransaction);
  const [loading, setLoading] = useState(!initialTransaction);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (initialTransaction) {
      setTransaction(initialTransaction);
      setLoading(false);
    } else if (transactionId) {
      loadTransactionDetails(transactionId);
    } else {
      setError('Aucune donnée de transaction fournie');
      setLoading(false);
    }
  }, [initialTransaction, transactionId]);
  
  const loadTransactionDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionService.getTransactionDetails(id);
      
      if (response.success) {
        setTransaction(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des détails');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des détails de la transaction');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    if (transaction?.id) {
      loadTransactionDetails(transaction.id);
    } else if (transactionId) {
      loadTransactionDetails(transactionId);
    }
  };
  
  const handleShare = async () => {
    if (!transaction) return;
    
    try {
      const transactionType = transaction.typeMouvement || transaction.type || transaction.sens || 'INCONNU';
      const isEpargne = transactionType.toLowerCase().includes('epargne') || 
                       transactionType.toLowerCase().includes('depot') ||
                       transactionType === 'EPARGNE';
      
      const operationType = isEpargne ? 'Épargne' : 'Retrait';
      const dateOperation = transaction.dateOperation || transaction.dateCreation || new Date();
      
      const message = `
📋 REÇU DE ${operationType.toUpperCase()}

📅 Date: ${formatDate(dateOperation)} à ${formatTime(dateOperation)}
🆔 Référence: ${transaction.id || 'N/A'}
💰 Montant: ${formatCurrency(transaction.montant)} FCFA
📊 Statut: ${transaction.statut || 'Complété'}
${transaction.libelle ? `📝 Description: ${transaction.libelle}` : ''}

👨‍💼 Opération effectuée par: ${user?.prenom} ${user?.nom}
🏦 FOCEP Microfinance
      `;
      
      await Share.share({
        message: message.trim(),
        title: `Reçu de ${operationType} - ${formatDate(dateOperation)}`
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de partager le reçu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderStatus = () => {
    let statusText = 'Complété';
    let statusColor = theme.colors.success;
    let statusIcon = 'checkmark-circle';
    
    const statut = transaction?.statut || transaction?.status || 'COMPLETED';
    
    switch (statut.toUpperCase()) {
      case 'COMPLETED':
      case 'VALIDE':
      case 'SUCCESS':
        break;
      case 'PENDING':
      case 'EN_ATTENTE':
        statusText = 'En attente';
        statusColor = theme.colors.warning;
        statusIcon = 'time';
        break;
      case 'FAILED':
      case 'ECHEC':
      case 'ERROR':
        statusText = 'Échoué';
        statusColor = theme.colors.error;
        statusIcon = 'close-circle';
        break;
    }
    
    return (
      <View style={[styles.statusContainer, { backgroundColor: `${statusColor}10` }]}>
        <Ionicons name={statusIcon} size={20} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    );
  };

  const Header = ({ title, onBackPress }) => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détails de l'opération"
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détails de l'opération"
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.errorContainer]}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={handleRefresh}
          >
            <Text style={styles.buttonTextPrimary}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détails de l'opération"
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.errorContainer]}>
          <Ionicons name="document-text-outline" size={60} color={theme.colors.gray} />
          <Text style={styles.errorTitle}>Données introuvables</Text>
          <Text style={styles.errorMessage}>Les détails de cette transaction ne sont pas disponibles.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const transactionType = transaction.typeMouvement || transaction.type || transaction.sens || 'INCONNU';
  const isIncome = transactionType.toLowerCase().includes('epargne') || 
                   transactionType.toLowerCase().includes('depot') ||
                   transactionType === 'EPARGNE';
  
  const dateOperation = transaction.dateOperation || transaction.dateCreation || new Date();
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Détails de l'opération"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, styles.amountCard]}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>
              {isIncome ? 'Épargne collectée' : 'Retrait effectué'}
            </Text>
            <Text style={[
              styles.amount,
              isIncome ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {isIncome ? '+' : '-'} {formatCurrency(transaction.montant)} FCFA
            </Text>
            {renderStatus()}
          </View>
          
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{formatDate(dateOperation)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Heure</Text>
              <Text style={styles.dateTimeValue}>{formatTime(dateOperation)}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.card, styles.detailsCard]}>
          <Text style={styles.cardTitle}>Détails de l'opération</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {isIncome ? 'Épargne' : 'Retrait'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Référence</Text>
            <Text style={styles.detailValue}>#{transaction.id}</Text>
          </View>
          
          {transaction.libelle && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{transaction.libelle}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, styles.actionButton]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color="white" />
          <Text style={styles.buttonTextPrimary}>Partager le reçu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
    ),
  },
  amountCard: {
    marginBottom: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  incomeAmount: {
    color: theme.colors.success,
  },
  expenseAmount: {
    color: theme.colors.error,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: 16,
  },
  dateTimeItem: {
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  detailsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonTextPrimary: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  retryButton: {
    minWidth: 150,
    backgroundColor: theme.colors.primary,
  },
});

export default TransactionDetailScreen;