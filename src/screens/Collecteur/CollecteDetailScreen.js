// src/screens/Collecteur/CollecteDetailScreen.js - IMPORTS CORRIGÉS
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

// ✅ CORRECTION CRITIQUE: Chemin correct depuis screens/Collecteur/
import { useAuth } from '../../hooks/useAuth';
import { transactionService } from '../../services';

// ✅ CORRECTION: Chemins corrects pour utils et theme
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, formatTime } from '../../utils/dateUtils';

const CollecteDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  
  // RÉCUPÉRATION DES PARAMÈTRES
  const { transaction: initialTransaction, transactionId } = route.params || {};
  
  // États
  const [transaction, setTransaction] = useState(initialTransaction);
  const [loading, setLoading] = useState(!initialTransaction);
  const [error, setError] = useState(null);
  
  // EFFET POUR CHARGER LES DÉTAILS
  useEffect(() => {
    console.log('🔍 CollecteDetailScreen - Paramètres reçus:', { 
      initialTransaction: initialTransaction?.id, 
      transactionId 
    });
    
    if (initialTransaction) {
      console.log('✅ Transaction fournie directement:', initialTransaction.id);
      setTransaction(initialTransaction);
      setLoading(false);
    } else if (transactionId) {
      console.log('🔄 Chargement de la transaction avec ID:', transactionId);
      loadTransactionDetails(transactionId);
    } else {
      console.error('❌ Aucune transaction ni ID fourni');
      setError('Aucune donnée de transaction fournie');
      setLoading(false);
    }
  }, [initialTransaction, transactionId]);
  
  // FONCTION POUR CHARGER LES DÉTAILS
  const loadTransactionDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des détails pour transaction:', id);
      
      const response = await transactionService.getTransactionDetails(id);
      console.log('✅ Détails récupérés:', response);
      
      if (response.success) {
        setTransaction(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des détails');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des détails de la transaction:', err);
      setError(err.message || 'Erreur lors du chargement des détails de la transaction');
    } finally {
      setLoading(false);
    }
  };
  
  // Rafraîchir les détails
  const handleRefresh = () => {
    if (transaction?.id) {
      loadTransactionDetails(transaction.id);
    } else if (transactionId) {
      loadTransactionDetails(transactionId);
    }
  };
  
  // FONCTION DE PARTAGE
  const handleShare = async () => {
    if (!transaction) return;
    
    try {
      const transactionType = transaction.typeMouvement || transaction.type || transaction.sens || 'INCONNU';
      const isEpargne = transactionType.toLowerCase().includes('epargne') || 
                       transactionType.toLowerCase().includes('depot') ||
                       transactionType === 'EPARGNE';
      
      const operationType = isEpargne ? 'Épargne' : 'Retrait';
      const dateOperation = transaction.dateOperation || transaction.dateCreation || new Date();
      const date = formatDate(dateOperation);
      const time = formatTime(dateOperation);
      
      const clientNom = transaction.client?.nom || 'Client';
      const clientPrenom = transaction.client?.prenom || '';
      const clientComplet = `${clientPrenom} ${clientNom}`.trim();
      
      const collecteurNom = transaction.collecteur?.nom || user?.nom || 'Collecteur';
      const collecteurPrenom = transaction.collecteur?.prenom || user?.prenom || '';
      const collecteurComplet = `${collecteurPrenom} ${collecteurNom}`.trim();
      
      const message = `
📋 REÇU DE ${operationType.toUpperCase()}

📅 Date: ${date} à ${time}
🆔 Référence: ${transaction.id || 'N/A'}
👤 Client: ${clientComplet}
💰 Montant: ${formatCurrency(transaction.montant)} FCFA
📊 Statut: ${transaction.statut || 'Complété'}
${transaction.libelle ? `📝 Description: ${transaction.libelle}` : ''}

👨‍💼 Opération effectuée par: ${collecteurComplet}
🏦 FOCEP Microfinance
      `;
      
      await Share.share({
        message: message.trim(),
        title: `Reçu de ${operationType} - ${date}`
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      Alert.alert('Erreur', 'Impossible de partager le reçu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Naviguer vers le client
  const handleViewClient = () => {
    if (transaction?.client) {
      navigation.navigate('ClientDetail', { 
        client: transaction.client,
        clientId: transaction.client.id 
      });
    }
  };
  
  // RENDU DU STATUT
  const renderStatus = () => {
    let statusText = 'Complété';
    let statusColor = theme.colors.success;
    let statusIcon = 'checkmark-circle';
    
    const statut = transaction?.statut || transaction?.status || 'COMPLETED';
    
    switch (statut.toUpperCase()) {
      case 'COMPLETED':
      case 'VALIDE':
      case 'SUCCESS':
        statusText = 'Complété';
        statusColor = theme.colors.success;
        statusIcon = 'checkmark-circle';
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
      default:
        statusText = 'Complété';
        statusColor = theme.colors.success;
        statusIcon = 'checkmark-circle';
    }
    
    return (
      <View style={[styles.statusContainer, { backgroundColor: `${statusColor}10` }]}>
        <Ionicons name={statusIcon} size={20} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    );
  };

  // COMPOSANTS UI
  const Header = ({ title, onBackPress }) => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const Card = ({ children, style, elevation = 1 }) => (
    <View style={[styles.card, style, { elevation }]}>
      {children}
    </View>
  );

  const Button = ({ 
    title, 
    onPress, 
    icon, 
    variant = 'primary', 
    style 
  }) => (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'outlined' ? styles.buttonOutlined : styles.buttonPrimary,
        style
      ]} 
      onPress={onPress}
    >
      {icon && <Ionicons name={icon} size={20} color={variant === 'outlined' ? theme.colors.primary : 'white'} />}
      <Text style={[
        styles.buttonText,
        variant === 'outlined' ? styles.buttonTextOutlined : styles.buttonTextPrimary
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
  
  // ÉTATS DE CHARGEMENT ET D'ERREUR
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
          <Button
            title="Réessayer"
            onPress={handleRefresh}
            style={styles.retryButton}
          />
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
  
  // DÉTERMINATION DU TYPE DE TRANSACTION
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
        {/* MONTANT ET TYPE */}
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
              <Text style={styles.dateTimeValue}>{formatDate(dateOperation)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Heure</Text>
              <Text style={styles.dateTimeValue}>{formatTime(dateOperation)}</Text>
            </View>
          </View>
        </Card>
        
        {/* INFORMATIONS CLIENT */}
        {transaction.client && (
          <Card style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Client</Text>
              <TouchableOpacity onPress={handleViewClient}>
                <Text style={styles.viewLink}>Voir profil</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nom complet</Text>
              <Text style={styles.detailValue}>
                {transaction.client.prenom} {transaction.client.nom}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>N° de compte</Text>
              <Text style={styles.detailValue}>
                {transaction.client.numeroCompte || `#${transaction.client.id}`}
              </Text>
            </View>
            
            {transaction.client.telephone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Téléphone</Text>
                <Text style={styles.detailValue}>{transaction.client.telephone}</Text>
              </View>
            )}
          </Card>
        )}
        
        {/* DÉTAILS DE LA TRANSACTION */}
        <Card style={styles.detailsCard}>
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
        </Card>
        
        {/* ACTIONS */}
        <View style={styles.actionsContainer}>
          <Button
            title="Partager le reçu"
            onPress={handleShare}
            icon="share-outline"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// STYLES SIMPLIFIÉS POUR L'EXEMPLE
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
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
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
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonTextPrimary: {
    color: 'white',
  },
  buttonTextOutlined: {
    color: theme.colors.primary,
  },
  retryButton: {
    minWidth: 150,
  },
});

export default CollecteDetailScreen;