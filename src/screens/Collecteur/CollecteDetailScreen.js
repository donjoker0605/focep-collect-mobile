// src/screens/Collecteur/CollecteDetailScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Share, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Components
import { 
  Header, 
  Card, 
  Button 
} from '../../components';

// Hooks et API
import { useAuth } from '../../hooks/useAuth';
import { getTransactionDetails } from '../../api/transaction';

// Utils et Theme
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, formatTime } from '../../utils/dateUtils';

const CollecteDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Récupérer la transaction depuis les paramètres de route
  const { transaction: initialTransaction } = route.params || {};
  
  // États
  const [transaction, setTransaction] = useState(initialTransaction);
  const [loading, setLoading] = useState(!initialTransaction);
  const [error, setError] = useState(null);
  
  // Charger les détails de la transaction si non fournie dans les paramètres
  useEffect(() => {
    if (!initialTransaction && route.params?.transactionId) {
      loadTransactionDetails(route.params.transactionId);
    }
  }, [initialTransaction, route.params?.transactionId]);
  
  // Charger les détails de la transaction
  const loadTransactionDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getTransactionDetails(id);
      setTransaction(response);
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la transaction:', err);
      setError(err.message || 'Erreur lors du chargement des détails de la transaction');
    } finally {
      setLoading(false);
    }
  };
  
  // Rafraîchir les détails
  const handleRefresh = () => {
    if (transaction?.id) {
      loadTransactionDetails(transaction.id);
    }
  };
  
  // Partager la transaction
  const handleShare = async () => {
    try {
      // Formatage des informations à partager
      const isIncome = transaction.type === 'EPARGNE';
      const operationType = isIncome ? 'Épargne' : 'Retrait';
      const date = formatDate(transaction.dateCreation);
      const time = formatTime(transaction.dateCreation);
      
      const message = `
Reçu de ${operationType}

Date: ${date} à ${time}
Référence: ${transaction.reference || 'N/A'}
Client: ${transaction.client.prenom} ${transaction.client.nom}
Montant: ${formatCurrency(transaction.montant)} FCFA
Statut: ${transaction.status === 'COMPLETED' ? 'Complété' : transaction.status}
${transaction.description ? `Description: ${transaction.description}` : ''}

Opération effectuée par: ${transaction.collecteur.prenom} ${transaction.collecteur.nom}
FOCEP Microfinance
      `;
      
      await Share.share({
        message,
        title: `Reçu de ${operationType} - ${date}`
      });
      
      // Vibration de réussite
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      Alert.alert('Erreur', 'Impossible de partager le reçu');
      
      // Vibration d'erreur
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Naviguer vers le client
  const handleViewClient = () => {
    if (transaction?.client) {
      navigation.navigate('ClientDetail', { client: transaction.client });
    }
  };
  
  // Rendu du statut de la transaction
  const renderStatus = () => {
    let statusText = 'Inconnu';
    let statusColor = theme.colors.gray;
    let statusIcon = 'help-circle';
    
    switch (transaction.status) {
      case 'COMPLETED':
        statusText = 'Complété';
        statusColor = theme.colors.success;
        statusIcon = 'checkmark-circle';
        break;
      case 'PENDING':
        statusText = 'En attente';
        statusColor = theme.colors.warning;
        statusIcon = 'time';
        break;
      case 'FAILED':
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
  
  // Si en cours de chargement
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Détails de l'opération"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </View>
    );
  }
  
  // Si erreur
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Détails de l'opération"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.errorContainer]}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={handleRefresh}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }
  
  // Si pas de transaction
  if (!transaction) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Détails de l'opération"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.content, styles.errorContainer]}>
          <Ionicons name="document-text-outline" size={60} color={theme.colors.gray} />
          <Text style={styles.errorTitle}>Données introuvables</Text>
          <Text style={styles.errorMessage}>Les détails de cette transaction ne sont pas disponibles.</Text>
          <Button
            title="Retour"
            onPress={() => navigation.goBack()}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }
  
  // Rendu principal
  const isIncome = transaction.type === 'EPARGNE';
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Détails de l'opération"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Montant et Type */}
        <Card style={styles.amountCard} elevation={2}>
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
              <Text style={styles.dateTimeValue}>{formatDate(transaction.dateCreation)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Heure</Text>
              <Text style={styles.dateTimeValue}>{formatTime(transaction.dateCreation)}</Text>
            </View>
          </View>
        </Card>
        
        {/* Informations du client */}
        <Card style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Client</Text>
            <TouchableOpacity onPress={handleViewClient}>
              <Text style={styles.viewLink}>Voir</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nom</Text>
            <Text style={styles.detailValue}>
              {transaction.client.prenom} {transaction.client.nom}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>N° de compte</Text>
            <Text style={styles.detailValue}>{transaction.client.numerCompte || 'N/A'}</Text>
          </View>
          
          {transaction.client.telephone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Téléphone</Text>
              <Text style={styles.detailValue}>{transaction.client.telephone}</Text>
            </View>
          )}
        </Card>
        
        {/* Détails de la transaction */}
        <Card style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Détails de l'opération</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: isIncome ? `${theme.colors.info}20` : `${theme.colors.error}20` }
            ]}>
              <Ionicons 
                name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'} 
                size={14} 
                color={isIncome ? theme.colors.info : theme.colors.error} 
                style={styles.typeIcon}
              />
              <Text style={[
                styles.typeText,
                { color: isIncome ? theme.colors.info : theme.colors.error }
              ]}>
                {isIncome ? 'Épargne' : 'Retrait'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Référence</Text>
            <Text style={styles.detailValue}>{transaction.reference || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Collecteur</Text>
            <Text style={styles.detailValue}>
              {transaction.collecteur.prenom} {transaction.collecteur.nom}
            </Text>
          </View>
          
          {transaction.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.descriptionText}>{transaction.description}</Text>
            </View>
          )}
        </Card>
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Partager le reçu"
            onPress={handleShare}
            icon="share-outline"
            style={styles.actionButton}
          />
          
          <Button
            title="Nouvelle opération"
            onPress={() => navigation.navigate('Collecte', { 
              selectedTab: isIncome ? 'epargne' : 'retrait',
              preSelectedClient: transaction.client
            })}
            variant="outlined"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.textLight,
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
  },
  retryButton: {
    minWidth: 150,
  },
  
  // Cards
  amountCard: {
    padding: 20,
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
    color: theme.colors.info,
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
  
  // Details
  detailsCard: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  viewLink: {
    color: theme.colors.primary,
    fontWeight: '500',
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  
  // Actions
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default CollecteDetailScreen;