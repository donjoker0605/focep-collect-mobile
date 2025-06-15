// src/screens/Admin/TransactionDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { transactionService } from '../../services';

const TransactionDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { transaction: initialTransaction } = route.params;
  
  const [transaction, setTransaction] = useState(initialTransaction);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isEpargne = transaction?.sens?.toUpperCase() === 'EPARGNE';

  useEffect(() => {
    loadTransactionDetails();
  }, []);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Si on a besoin de plus de détails, charger depuis l'API
      if (transaction?.id) {
        const response = await transactionService.getTransactionById(transaction.id);
        if (response.success) {
          setTransaction(response.data);
        } else {
          setError('Impossible de charger les détails de la transaction');
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `
Transaction ${isEpargne ? 'Épargne' : 'Retrait'}
Client: ${transaction.clientNom || 'N/A'}
Montant: ${formatCurrency(transaction.montant)}
Date: ${formatDate(transaction.dateOperation)}
Référence: ${transaction.reference || 'N/A'}
`;
      
      await Share.share({
        message,
        title: 'Détails de transaction',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Impression',
      'La fonctionnalité d\'impression sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const handleCancel = () => {
    if (transaction?.statut === 'COMPLETE') {
      Alert.alert(
        'Impossible',
        'Cette transaction est déjà complétée et ne peut pas être annulée',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Annuler la transaction',
      'Êtes-vous sûr de vouloir annuler cette transaction ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await transactionService.cancelTransaction(transaction.id);
              if (response.success) {
                Alert.alert(
                  'Succès',
                  'La transaction a été annulée',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Erreur', response.error || 'Impossible d\'annuler la transaction');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount) => {
    return `${new Intl.NumberFormat('fr-FR').format(amount || 0)} FCFA`;
  };

  const formatDate = (date) => {
    if (!date) return 'Date non disponible';
    return format(new Date(date), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETE':
      case 'SUCCESS':
        return theme.colors.success;
      case 'PENDING':
        return theme.colors.warning;
      case 'CANCELLED':
      case 'FAILED':
        return theme.colors.error;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETE':
      case 'SUCCESS':
        return 'Complétée';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulée';
      case 'FAILED':
        return 'Échouée';
      default:
        return status || 'Inconnu';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails de transaction"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails de transaction"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={loadTransactionDetails}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Détails de transaction"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête de transaction */}
        <Card style={styles.headerCard}>
          <View style={styles.transactionHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: isEpargne ? 
                'rgba(52, 199, 89, 0.1)' : 
                'rgba(255, 59, 48, 0.1)' 
              }
            ]}>
              <Ionicons 
                name={isEpargne ? "add-circle" : "remove-circle"} 
                size={48} 
                color={isEpargne ? theme.colors.success : theme.colors.error} 
              />
            </View>
            
            <Text style={styles.transactionType}>
              {isEpargne ? 'Épargne' : 'Retrait'}
            </Text>
            
            <Text style={[
              styles.transactionAmount,
              { color: isEpargne ? theme.colors.success : theme.colors.error }
            ]}>
              {isEpargne ? '+' : '-'}{formatCurrency(transaction.montant)}
            </Text>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(transaction.statut)}20` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(transaction.statut) }
              ]}>
                {getStatusText(transaction.statut)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Informations principales */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informations de la transaction</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Référence</Text>
            <Text style={styles.infoValue}>{transaction.reference || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date et heure</Text>
            <Text style={styles.infoValue}>{formatDate(transaction.dateOperation)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ClientDetailScreen', {
                client: { 
                  id: transaction.clientId,
                  nom: transaction.clientNom,
                  prenom: transaction.clientPrenom
                }
              })}
            >
              <Text style={[styles.infoValue, styles.linkText]}>
                {transaction.clientNom || 'Client inconnu'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Collecteur</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CollecteurDetailScreen', {
                collecteur: { 
                  id: transaction.collecteurId,
                  nom: transaction.collecteurNom
                }
              })}
            >
              <Text style={[styles.infoValue, styles.linkText]}>
                {transaction.collecteurNom || 'Collecteur inconnu'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {transaction.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{transaction.description}</Text>
            </View>
          )}
        </Card>

        {/* Soldes */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Détails financiers</Text>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Solde avant</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(transaction.soldeAvant)}
            </Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Montant {isEpargne ? 'déposé' : 'retiré'}</Text>
            <Text style={[
              styles.balanceValue,
              { color: isEpargne ? theme.colors.success : theme.colors.error }
            ]}>
              {isEpargne ? '+' : '-'}{formatCurrency(transaction.montant)}
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, styles.bold]}>Solde après</Text>
            <Text style={[styles.balanceValue, styles.bold]}>
              {formatCurrency(transaction.soldeApres)}
            </Text>
          </View>
        </Card>

        {/* Informations techniques */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informations techniques</Text>
          
          <View style={styles.techInfo}>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>ID Transaction</Text>
              <Text style={styles.techValue}>{transaction.id}</Text>
            </View>
            
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Type d'opération</Text>
              <Text style={styles.techValue}>{transaction.typeOperation || 'Standard'}</Text>
            </View>
            
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Méthode</Text>
              <Text style={styles.techValue}>{transaction.methode || 'Espèces'}</Text>
            </View>
            
            {transaction.dateValidation && (
              <View style={styles.techRow}>
                <Text style={styles.techLabel}>Date validation</Text>
                <Text style={styles.techValue}>
                  {format(new Date(transaction.dateValidation), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </Text>
              </View>
            )}
            
            {transaction.validePar && (
              <View style={styles.techRow}>
                <Text style={styles.techLabel}>Validé par</Text>
                <Text style={styles.techValue}>{transaction.validePar}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Imprimer le reçu"
            onPress={handlePrint}
            style={styles.actionButton}
            variant="secondary"
            icon="print-outline"
          />
          
          {transaction?.statut !== 'COMPLETE' && transaction?.statut !== 'CANCELLED' && (
            <Button
              title="Annuler la transaction"
              onPress={handleCancel}
              style={[styles.actionButton, styles.cancelButton]}
              variant="danger"
              icon="close-circle-outline"
            />
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  headerCard: {
    margin: 20,
    padding: 24,
    alignItems: 'center',
  },
  transactionHeader: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionType: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  techInfo: {
    backgroundColor: theme.colors.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  techLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  techValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
});

export default TransactionDetailScreen;