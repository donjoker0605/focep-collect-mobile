// src/screens/Admin/TransactionDetailScreen.js - VUE DÉTAILLÉE TRANSACTION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { transactionService, compteService } from '../../services';

const TransactionDetailScreen = ({ navigation, route }) => {
  const { transaction: initialTransaction } = route.params || {};
  
  // États pour les données
  const [transaction, setTransaction] = useState(initialTransaction);
  const [compteDetails, setCompteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transaction) {
      Alert.alert('Erreur', 'Informations de la transaction manquantes');
      navigation.goBack();
      return;
    }
    
    loadTransactionDetails();
  }, [transaction]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les détails complets de la transaction et du compte
      const [transactionResponse, compteResponse] = await Promise.all([
        transactionService.getTransactionById(transaction.id),
        transaction.compteId ? compteService.getCompteDetails(transaction.compteId) : Promise.resolve({ success: false })
      ]);
      
      if (transactionResponse.success) {
        setTransaction(transactionResponse.data);
      }
      
      if (compteResponse.success) {
        setCompteDetails(compteResponse.data);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError(err.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleShareTransaction = async () => {
    try {
      const transactionInfo = `
Transaction ${transaction.type || 'Inconnue'}
Montant: ${transaction.montant ? transaction.montant.toLocaleString() : '0'} FCFA
Client: ${transaction.client ? `${transaction.client.prenom} ${transaction.client.nom}` : 'Inconnu'}
Date: ${transaction.dateTransaction ? new Date(transaction.dateTransaction).toLocaleString('fr-FR') : 'Inconnue'}
Référence: ${transaction.reference || 'Non renseignée'}
      `.trim();

      await Share.share({
        message: transactionInfo,
        title: 'Détails de la transaction'
      });
    } catch (err) {
      console.error('Erreur lors du partage:', err);
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implémenter l'impression du reçu
    Alert.alert('Information', 'Impression en cours de développement');
  };

  const handleViewClient = () => {
    if (transaction.client) {
      navigation.navigate('ClientDetailScreen', { client: transaction.client });
    }
  };

  const handleViewCollecteur = () => {
    if (transaction.collecteur) {
      navigation.navigate('CollecteurDetailScreen', { collecteur: transaction.collecteur });
    }
  };

  const handleViewCompte = () => {
    if (compteDetails) {
      navigation.navigate('CompteDetailScreen', { compte: compteDetails });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const getTransactionTypeInfo = (type) => {
    switch (type) {
      case 'EPARGNE':
        return {
          label: 'Épargne',
          icon: 'arrow-down-circle',
          color: theme.colors.success,
          description: 'Dépôt d\'argent sur le compte'
        };
      case 'RETRAIT':
        return {
          label: 'Retrait',
          icon: 'arrow-up-circle',
          color: theme.colors.warning,
          description: 'Retrait d\'argent du compte'
        };
      case 'TRANSFERT':
        return {
          label: 'Transfert',
          icon: 'swap-horizontal',
          color: theme.colors.primary,
          description: 'Transfert entre comptes'
        };
      default:
        return {
          label: 'Transaction',
          icon: 'document',
          color: theme.colors.gray,
          description: 'Type de transaction inconnu'
        };
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Terminée',
          color: theme.colors.success,
          icon: 'checkmark-circle'
        };
      case 'PENDING':
        return {
          label: 'En cours',
          color: theme.colors.warning,
          icon: 'time'
        };
      case 'FAILED':
        return {
          label: 'Échouée',
          color: theme.colors.error,
          icon: 'close-circle'
        };
      case 'CANCELLED':
        return {
          label: 'Annulée',
          color: theme.colors.gray,
          icon: 'ban'
        };
      default:
        return {
          label: 'Statut inconnu',
          color: theme.colors.gray,
          icon: 'help-circle'
        };
    }
  };

  // ✅ RENDU PRINCIPAL
  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Détails transaction"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Informations de la transaction manquantes</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getTransactionTypeInfo(transaction.type);
  const statusInfo = getStatusInfo(transaction.status || 'COMPLETED');

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Détails transaction"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareTransaction}
          >
            <Ionicons name="share" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.contentContainer}>
        {/* En-tête de la transaction */}
        <Card style={styles.headerCard}>
          <View style={styles.transactionHeader}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}20` }]}>
              <Ionicons name={typeInfo.icon} size={32} color={typeInfo.color} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.transactionType}>{typeInfo.label}</Text>
              <Text style={styles.transactionAmount}>
                {transaction.type === 'EPARGNE' ? '+' : transaction.type === 'RETRAIT' ? '-' : ''}
                {transaction.montant ? transaction.montant.toLocaleString() : '0'} FCFA
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.transactionDescription}>{typeInfo.description}</Text>
        </Card>

        {/* Informations générales */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date et heure</Text>
              <Text style={styles.infoValue}>
                {formatDate(transaction.dateTransaction)}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="document-text" size={20} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Référence</Text>
              <Text style={styles.infoValue}>
                {transaction.reference || 'Non renseignée'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="cash" size={20} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Montant</Text>
              <Text style={[styles.infoValue, styles.amountText]}>
                {transaction.montant ? transaction.montant.toLocaleString() : '0'} FCFA
              </Text>
            </View>
          </View>
          
          {transaction.fraisTransaction && (
            <View style={styles.infoItem}>
              <Ionicons name="card" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Frais de transaction</Text>
                <Text style={styles.infoValue}>
                  {transaction.fraisTransaction.toLocaleString()} FCFA
                </Text>
              </View>
            </View>
          )}
          
          {transaction.commentaire && (
            <View style={styles.infoItem}>
              <Ionicons name="chatbubble" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Commentaire</Text>
                <Text style={styles.infoValue}>{transaction.commentaire}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Informations du client */}
        {transaction.client && (
          <Card style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Client</Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewClient}
              >
                <Text style={styles.viewButtonText}>Voir profil</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoValue}>
                  {`${transaction.client.prenom || ''} ${transaction.client.nom || ''}`.trim() || 'Nom inconnu'}
                </Text>
              </View>
            </View>
            
            {transaction.client.numeroCompte && (
              <View style={styles.infoItem}>
                <Ionicons name="card" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Numéro de compte</Text>
                  <Text style={styles.infoValue}>{transaction.client.numeroCompte}</Text>
                </View>
              </View>
            )}
            
            {transaction.client.telephone && (
              <View style={styles.infoItem}>
                <Ionicons name="call" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{transaction.client.telephone}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Informations du collecteur */}
        {transaction.collecteur && (
          <Card style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Collecteur</Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewCollecteur}
              >
                <Text style={styles.viewButtonText}>Voir profil</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoValue}>
                  {`${transaction.collecteur.prenom || ''} ${transaction.collecteur.nom || ''}`.trim() || 'Nom inconnu'}
                </Text>
              </View>
            </View>
            
            {transaction.collecteur.adresseMail && (
              <View style={styles.infoItem}>
                <Ionicons name="mail" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{transaction.collecteur.adresseMail}</Text>
                </View>
              </View>
            )}
            
            {transaction.collecteur.telephone && (
              <View style={styles.infoItem}>
                <Ionicons name="call" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{transaction.collecteur.telephone}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Informations du compte */}
        {compteDetails && (
          <Card style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compte associé</Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewCompte}
              >
                <Text style={styles.viewButtonText}>Voir compte</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="wallet" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Numéro de compte</Text>
                <Text style={styles.infoValue}>{compteDetails.numeroCompte || 'Non renseigné'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Solde actuel</Text>
                <Text style={[styles.infoValue, styles.balanceText]}>
                  {compteDetails.solde ? compteDetails.solde.toLocaleString() : '0'} FCFA
                </Text>
              </View>
            </View>
            
            {compteDetails.soldeAvantTransaction !== undefined && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Solde avant transaction</Text>
                  <Text style={styles.infoValue}>
                    {compteDetails.soldeAvantTransaction.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Informations techniques */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informations techniques</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="finger-print" size={20} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>ID Transaction</Text>
              <Text style={styles.infoValue}>{transaction.id || 'Non renseigné'}</Text>
            </View>
          </View>
          
          {transaction.journal && (
            <View style={styles.infoItem}>
              <Ionicons name="book" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Journal</Text>
                <Text style={styles.infoValue}>
                  Journal #{transaction.journal.id} - {transaction.journal.dateOuverture ? 
                    new Date(transaction.journal.dateOuverture).toLocaleDateString('fr-FR') : 
                    'Date inconnue'
                  }
                </Text>
              </View>
            </View>
          )}
          
          {transaction.dateCreation && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date de création</Text>
                <Text style={styles.infoValue}>
                  {formatDate(transaction.dateCreation)}
                </Text>
              </View>
            </View>
          )}
          
          {transaction.dateModification && transaction.dateModification !== transaction.dateCreation && (
            <View style={styles.infoItem}>
              <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Dernière modification</Text>
                <Text style={styles.infoValue}>
                  {formatDate(transaction.dateModification)}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Boutons d'action */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title="Imprimer reçu"
            onPress={handlePrintReceipt}
            style={styles.actionButton}
            icon="print"
          />
          <Button
            title="Partager"
            onPress={handleShareTransaction}
            style={styles.actionButton}
            variant="outline"
            icon="share"
          />
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },
  shareButton: {
    padding: 8,
  },
  headerCard: {
    marginBottom: 16,
    padding: 20,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

export default TransactionDetailScreen;