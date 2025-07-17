// src/screens/Admin/CollecteurComptesDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import versementService from '../../services/versementService';

const CollecteurComptesDetailScreen = ({ route, navigation }) => {
  const { collecteur } = route.params;
  
  // États
  const [comptesData, setComptesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComptesData();
  }, []);

  const loadComptesData = async () => {
    try {
      setError(null);
      const response = await versementService.getCollecteurComptes(collecteur.id);
      
      if (response.success) {
        setComptesData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement des comptes');
      }
    } catch (err) {
      console.error('Erreur chargement comptes:', err);
      setError(err.message || 'Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadComptesData();
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  };

  const getCompteStatusColor = (solde) => {
    if (solde > 0) return theme.colors.success;
    if (solde < 0) return theme.colors.error;
    return theme.colors.textLight;
  };

  const handleRemboursementManquant = () => {
    if (!comptesData || comptesData.compteManquantSolde <= 0) return;

    Alert.prompt(
      'Remboursement Manquant',
      `Montant actuel du manquant : ${formatCurrency(comptesData.compteManquantSolde)}\n\nSaisissez le montant à rembourser :`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Rembourser', 
          onPress: (montant) => {
            if (montant && parseFloat(montant) > 0) {
              executeRemboursement(parseFloat(montant));
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const executeRemboursement = async (montant) => {
    try {
      setLoading(true);
      
      const response = await versementService.remboursementManquant(
        collecteur.id,
        montant,
        `Remboursement manquant effectué par admin le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`
      );

      if (response.success) {
        Alert.alert(
          'Succès',
          `Remboursement de ${formatCurrency(montant)} effectué avec succès !`,
          [{ text: 'OK', onPress: loadComptesData }]
        );
      } else {
        Alert.alert('Erreur', response.error || 'Erreur lors du remboursement');
      }
    } catch (err) {
      console.error('Erreur remboursement:', err);
      Alert.alert('Erreur', err.message || 'Erreur lors du remboursement');
    } finally {
      setLoading(false);
    }
  };

  const renderCompteCard = (titre, solde, numero, couleur = theme.colors.primary, icon = "card") => (
    <Card style={styles.compteCard}>
      <View style={styles.compteHeader}>
        <View style={styles.compteIconContainer}>
          <Ionicons name={icon} size={24} color={couleur} />
        </View>
        <View style={styles.compteInfo}>
          <Text style={styles.compteTitle}>{titre}</Text>
          <Text style={styles.compteNumero}>{numero || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.compteMontant}>
        <Text style={[styles.soldeMontant, { color: getCompteStatusColor(solde) }]}>
          {formatCurrency(solde)}
        </Text>
      </View>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Comptes Collecteur"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des comptes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Comptes Collecteur"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={loadComptesData}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Comptes Collecteur"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* En-tête collecteur */}
        <Card style={styles.collecteurCard}>
          <View style={styles.collecteurInfo}>
            <View style={styles.collecteurAvatar}>
              <Ionicons name="person" size={32} color={theme.colors.white} />
            </View>
            <View style={styles.collecteurDetails}>
              <Text style={styles.collecteurNom}>{comptesData?.collecteurNom}</Text>
              <Text style={styles.collecteurId}>ID: {collecteur.id}</Text>
            </View>
          </View>
        </Card>

        {/* Résumé global */}
        <Card style={styles.resumeCard}>
          <Text style={styles.cardTitle}>Résumé Global</Text>
          
          <View style={styles.resumeRow}>
            <Text style={styles.resumeLabel}>Total Créances (Manquants):</Text>
            <Text style={[styles.resumeValue, { color: theme.colors.error }]}>
              {formatCurrency(comptesData?.totalCreances || 0)}
            </Text>
          </View>

          <View style={styles.resumeRow}>
            <Text style={styles.resumeLabel}>Total Avoirs (Attente + Rémunération):</Text>
            <Text style={[styles.resumeValue, { color: theme.colors.success }]}>
              {formatCurrency(comptesData?.totalAvoirs || 0)}
            </Text>
          </View>

          <View style={[styles.resumeRow, styles.soldeNetRow]}>
            <Text style={styles.resumeLabel}>Solde Net:</Text>
            <Text style={[
              styles.resumeValue, 
              styles.soldeNet,
              { color: getCompteStatusColor(comptesData?.soldeNet || 0) }
            ]}>
              {formatCurrency(comptesData?.soldeNet || 0)}
            </Text>
          </View>
        </Card>

        {/* Comptes détaillés */}
        <View style={styles.comptesSection}>
          <Text style={styles.sectionTitle}>Comptes Détaillés</Text>

          {/* Compte Service */}
          {renderCompteCard(
            "Compte Service",
            comptesData?.compteServiceSolde || 0,
            comptesData?.compteServiceNumero,
            theme.colors.primary,
            "card"
          )}

          {/* Compte Manquant */}
          {renderCompteCard(
            "Compte Manquant",
            comptesData?.compteManquantSolde || 0,
            comptesData?.compteManquantNumero,
            theme.colors.error,
            "warning"
          )}

          {/* Compte Attente */}
          {renderCompteCard(
            "Compte Attente",
            comptesData?.compteAttenteSolde || 0,
            comptesData?.compteAttenteNumero,
            theme.colors.warning,
            "time"
          )}

          {/* Compte Rémunération */}
          {renderCompteCard(
            "Compte Rémunération",
            comptesData?.compteRemunerationSolde || 0,
            comptesData?.compteRemunerationNumero,
            theme.colors.success,
            "cash"
          )}
        </View>

        {/* Actions */}
        {comptesData?.compteManquantSolde > 0 && (
          <Card style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Actions</Text>
            <Text style={styles.actionDescription}>
              Ce collecteur a un manquant de {formatCurrency(comptesData.compteManquantSolde)}.
              Vous pouvez effectuer un remboursement partiel ou total.
            </Text>
            
            <Button
              title="Effectuer un remboursement"
              onPress={handleRemboursementManquant}
              style={styles.remboursementButton}
              icon="cash"
              variant="outline"
            />
          </Card>
        )}

        {/* Informations */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informations</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Le compte service représente le montant collecté par le collecteur.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <Text style={styles.infoText}>
              Le compte manquant représente les sommes dues par le collecteur à l'entreprise.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color={theme.colors.warning} />
            <Text style={styles.infoText}>
              Le compte attente contient les excédents de versement du collecteur.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },
  refreshButton: {
    padding: 8,
  },
  collecteurCard: {
    padding: 16,
    marginBottom: 16,
  },
  collecteurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collecteurAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  collecteurNom: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  collecteurId: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  resumeCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  resumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  soldeNetRow: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resumeLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  resumeValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  soldeNet: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  comptesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  compteCard: {
    padding: 16,
    marginBottom: 12,
  },
  compteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compteInfo: {
    flex: 1,
  },
  compteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  compteNumero: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  compteMontant: {
    alignItems: 'flex-end',
  },
  soldeMontant: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  actionDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  remboursementButton: {
    marginTop: 8,
  },
  infoCard: {
    padding: 16,
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});

export default CollecteurComptesDetailScreen;