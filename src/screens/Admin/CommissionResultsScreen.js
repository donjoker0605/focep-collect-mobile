// src/screens/Admin/CommissionResultsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import StatsCard from '../../components/StatsCard/StatsCard';
import DataTable from '../../components/DataTable/DataTable';

import colors from '../../theme/colors';
import { formatters } from '../../utils/formatters';

/**
 * Écran des résultats de commission avec détails complets
 * Affiche les informations calculées pour le collecteur et tous ses clients
 */
export default function CommissionResultsScreen({ route, navigation }) {
  const { commissionResult, collecteur } = route.params;

  // Préparation des données pour le tableau
  const prepareTableData = () => {
    if (!commissionResult.commissionsClients || commissionResult.commissionsClients.length === 0) {
      return [];
    }

    return commissionResult.commissionsClients.map((client, index) => ({
      id: client.clientId || index,
      nom: client.clientNom || `Client ${index + 1}`,
      epargne: formatters.formatMoney(client.montantEpargne || 0),
      commissionX: formatters.formatMoney(client.commissionX || 0),
      tva: formatters.formatMoney(client.tva || 0),
      totalPrelevement: formatters.formatMoney((client.commissionX || 0) + (client.tva || 0)),
      nouveauSolde: formatters.formatMoney(client.nouveauSolde || 0),
      typeParametre: client.parameterUsed || 'N/A'
    }));
  };

  const tableColumns = [
    { field: 'nom', title: 'Client', flex: 2 },
    { field: 'epargne', title: 'Épargne', flex: 1.5 },
    { field: 'commissionX', title: 'Commission (x)', flex: 1.5 },
    { field: 'tva', title: 'TVA 19,25%', flex: 1.2 },
    { field: 'totalPrelevement', title: 'Total Prélevé', flex: 1.5 },
    { field: 'nouveauSolde', title: 'Nouveau Solde', flex: 1.5 },
    { field: 'typeParametre', title: 'Type', flex: 1 },
  ];

  const tableData = prepareTableData();

  // Statistiques calculées
  const stats = {
    nombreClients: commissionResult.commissionsClients?.length || 0,
    montantSCollecteur: commissionResult.montantSCollecteur || 0,
    totalTVA: commissionResult.totalTVA || 0,
    totalEpargne: commissionResult.commissionsClients?.reduce((sum, client) => 
      sum + (client.montantEpargne || 0), 0) || 0,
    totalPrelevement: (commissionResult.montantSCollecteur || 0) + (commissionResult.totalTVA || 0)
  };

  const handleGenerateReport = () => {
    // TODO: Implémenter la génération de rapport Excel
    console.log('📊 Génération rapport commission:', commissionResult);
  };

  const handleNewCalculation = () => {
    navigation.goBack();
  };

  const handleProcessusComplet = () => {
    navigation.navigate('CommissionProcessusCompletScreen', {
      collecteur,
      commissionResult
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Résultats Commission</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={handleGenerateReport}
            >
              <Icon name="file-download" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations du collecteur */}
        <Card style={styles.collecteurCard}>
          <View style={styles.collecteurHeader}>
            <Icon name="person" size={32} color={colors.primary} />
            <View style={styles.collecteurInfo}>
              <Text style={styles.collecteurName}>
                {collecteur?.nomComplet || `${collecteur?.prenom} ${collecteur?.nom}`}
              </Text>
              <Text style={styles.collecteurEmail}>{collecteur?.adresseMail}</Text>
              <Text style={styles.periode}>Période: {commissionResult.periode}</Text>
            </View>
          </View>
        </Card>

        {/* Statistiques principales */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Résumé des Commissions</Text>
          <View style={styles.statsRow}>
            <StatsCard
              title="Clients Traités"
              value={stats.nombreClients.toString()}
              icon="people"
              color={colors.info}
              style={styles.statCard}
            />
            <StatsCard
              title="Total Épargne"
              value={formatters.formatMoney(stats.totalEpargne)}
              icon="bookmark-outline"
              color={colors.success}
              style={styles.statCard}
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatsCard
              title="Commission S"
              value={formatters.formatMoney(stats.montantSCollecteur)}
              icon="cash"
              color={colors.warning}
              style={styles.statCard}
              subtitle="Montant collecteur"
            />
            <StatsCard
              title="TVA (19,25%)"
              value={formatters.formatMoney(stats.totalTVA)}
              icon="receipt"
              color={colors.error}
              style={styles.statCard}
            />
          </View>

          {/* Montant total prélevé */}
          <Card style={styles.totalCard}>
            <View style={styles.totalContent}>
              <Icon name="calculate" size={28} color={colors.primary} />
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>Total Prélevé (Commission + TVA)</Text>
                <Text style={styles.totalValue}>
                  {formatters.formatMoney(stats.totalPrelevement)}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Détail par client */}
        <Card style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.sectionTitle}>Détail par Client</Text>
            <Text style={styles.detailSubtitle}>
              Commission "x" calculée pour chaque client
            </Text>
          </View>

          {tableData.length > 0 ? (
            <DataTable
              data={tableData}
              columns={tableColumns}
              style={styles.dataTable}
              emptyTitle="Aucune commission calculée"
              emptyMessage="Aucun client n'a généré de commission sur cette période."
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="info" size={48} color={colors.textSecondary} />
              <Text style={styles.noDataTitle}>Aucune Commission Calculée</Text>
              <Text style={styles.noDataMessage}>
                Aucun mouvement d'épargne trouvé pour les clients de ce collecteur sur la période sélectionnée.
              </Text>
              <Text style={styles.noDataHint}>
                • Vérifiez que les clients ont effectué des opérations d'épargne
                {'\n'}• Assurez-vous que la période sélectionnée est correcte
                {'\n'}• Vérifiez les paramètres de commission configurés
              </Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionButtons}>
            <Button
              title="Nouveau Calcul"
              onPress={handleNewCalculation}
              variant="secondary"
              style={styles.actionButton}
              icon="refresh"
            />
            
            <Button
              title="Processus Complet"
              onPress={handleProcessusComplet}
              style={styles.actionButton}
              icon="auto-fix"
              subtitle="Commission + Rémunération"
            />
          </View>

          <Button
            title="Générer Rapport Excel"
            onPress={handleGenerateReport}
            variant="outline"
            style={styles.reportButtonLarge}
            icon="description"
          />
        </Card>

        {/* Informations techniques */}
        <View style={styles.technicalInfo}>
          <Text style={styles.technicalText}>
            Calcul effectué le {formatters.formatDateTime(commissionResult.dateCalcul)}
          </Text>
          <Text style={styles.technicalText}>
            Agence ID: {commissionResult.agenceId} • Collecteur ID: {commissionResult.collecteurId}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reportButton: {
    padding: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 8
  },
  collecteurCard: {
    marginBottom: 16,
    padding: 16
  },
  collecteurHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  collecteurInfo: {
    marginLeft: 16,
    flex: 1
  },
  collecteurName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2
  },
  collecteurEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4
  },
  periode: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500'
  },
  statsSection: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  statCard: {
    flex: 0.48
  },
  totalCard: {
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30'
  },
  totalContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  totalInfo: {
    marginLeft: 16,
    flex: 1
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary
  },
  detailCard: {
    marginBottom: 16
  },
  detailHeader: {
    marginBottom: 16
  },
  detailSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4
  },
  dataTable: {
    marginTop: 8
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 32
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  noDataMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16
  },
  noDataHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 18,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace'
  },
  actionsCard: {
    marginBottom: 16
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  actionButton: {
    flex: 0.48
  },
  reportButtonLarge: {
    marginTop: 8
  },
  technicalInfo: {
    alignItems: 'center',
    paddingVertical: 16
  },
  technicalText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4
  }
});