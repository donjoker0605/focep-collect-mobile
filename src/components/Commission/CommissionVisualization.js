// src/components/Commission/CommissionVisualization.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, ProgressIndicator } from '../index';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

/**
 * Composant pour visualiser les commissions calculées par le backend
 * 
 * @param {Object} props Les propriétés du composant
 * @param {Object} props.data Données de commission calculées par le backend
 * @param {boolean} props.loading État de chargement
 * @param {Object} props.error Erreur éventuelle
 * @param {Function} props.onRetry Fonction pour réessayer en cas d'erreur
 * @param {Object} props.periode Période de calcul des commissions
 * @param {Object} props.style Styles supplémentaires
 */
const CommissionVisualization = ({
  data = null,
  loading = false,
  error = null,
  onRetry = null,
  periode = { debut: null, fin: null },
  onPrint = null,
  onExport = null,
  style,
}) => {
  // Fonction pour afficher correctement la période
  const formatPeriode = () => {
    if (!periode.debut || !periode.fin) return 'Période non définie';
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const debut = new Date(periode.debut).toLocaleDateString('fr-FR', options);
    const fin = new Date(periode.fin).toLocaleDateString('fr-FR', options);
    
    return `Du ${debut} au ${fin}`;
  };
  
  // Rendu de la section de répartition
  const renderRepartition = () => {
    if (!data || !data.repartition) return null;
    
    const { partCollecteur, partEMF, montantTVA, montantTotal } = data.repartition;
    
    // Calcul des pourcentages pour l'affichage visuel
    const totalAmount = montantTotal || 1; // Éviter la division par zéro
    const collecteurPercent = (partCollecteur / totalAmount) * 100;
    const emfPercent = (partEMF / totalAmount) * 100;
    const tvaPercent = (montantTVA / totalAmount) * 100;
    
    return (
      <View style={styles.repartitionContainer}>
        <Text style={styles.sectionTitle}>Répartition des commissions</Text>
        
        <Card style={styles.repartitionCard}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Montant total des commissions</Text>
            <Text style={styles.totalValue}>{formatCurrency(montantTotal)} FCFA</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <View style={styles.progressLabelContainer}>
                <View style={[styles.colorIndicator, { backgroundColor: theme.colors.primary }]} />
                <Text style={styles.progressLabel}>Part Collecteur (70%)</Text>
              </View>
              <ProgressIndicator 
                progress={collecteurPercent / 100}
                progressColor={theme.colors.primary}
                height={8}
                showPercentage={false}
              />
              <Text style={styles.progressValue}>{formatCurrency(partCollecteur)} FCFA</Text>
            </View>
            
            <View style={styles.progressItem}>
              <View style={styles.progressLabelContainer}>
                <View style={[styles.colorIndicator, { backgroundColor: theme.colors.info }]} />
                <Text style={styles.progressLabel}>Part EMF (30%)</Text>
              </View>
              <ProgressIndicator 
                progress={emfPercent / 100}
                progressColor={theme.colors.info}
                height={8}
                showPercentage={false}
              />
              <Text style={styles.progressValue}>{formatCurrency(partEMF)} FCFA</Text>
            </View>
            
            <View style={styles.progressItem}>
              <View style={styles.progressLabelContainer}>
                <View style={[styles.colorIndicator, { backgroundColor: theme.colors.warning }]} />
                <Text style={styles.progressLabel}>TVA (19,25%)</Text>
              </View>
              <ProgressIndicator 
                progress={tvaPercent / 100}
                progressColor={theme.colors.warning}
                height={8}
                showPercentage={false}
              />
              <Text style={styles.progressValue}>{formatCurrency(montantTVA)} FCFA</Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };
  
  // Rendu du détail des commissions par client
  const renderClientCommissions = () => {
    if (!data || !data.detailsParClient || data.detailsParClient.length === 0) return null;
    
    return (
      <View style={styles.clientsContainer}>
        <Text style={styles.sectionTitle}>Détail par client</Text>
        
        {data.detailsParClient.map((client, index) => (
          <Card 
            key={index}
            style={styles.clientCard}
          >
            <View style={styles.clientHeader}>
              <Text style={styles.clientName}>
                {client.nom} {client.prenom}
              </Text>
              <Text style={styles.clientId}>ID: {client.id}</Text>
            </View>
            
            <View style={styles.clientDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total épargné</Text>
                <Text style={styles.detailValue}>{formatCurrency(client.montantTotal)} FCFA</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Commission calculée</Text>
                <Text style={styles.detailValue}>{formatCurrency(client.commission)} FCFA</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>TVA appliquée</Text>
                <Text style={styles.detailValue}>{formatCurrency(client.tva)} FCFA</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Méthode</Text>
                <Text style={styles.detailValue}>
                  {client.methode === 'FIXED' 
                    ? 'Montant fixe' 
                    : client.methode === 'PERCENTAGE' 
                      ? 'Pourcentage' 
                      : 'Palier'
                  }
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    );
  };
  
  // Rendu des actions (Imprimer, Exporter)
  const renderActions = () => {
    if (!data) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {onPrint && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onPrint}
          >
            <Ionicons name="print-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionText}>Imprimer</Text>
          </TouchableOpacity>
        )}
        
        {onExport && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onExport}
          >
            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionText}>Exporter</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Rendu principal
  return (
    <View style={[styles.container, style]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Calcul des commissions en cours...</Text>
        </View>
      ) : error ? (
        <EmptyState
          type="error"
          title="Erreur de calcul"
          message={error}
          actionButton={!!onRetry}
          actionButtonTitle="Réessayer"
          onActionButtonPress={onRetry}
        />
      ) : !data ? (
        <EmptyState
          type="no-results"
          title="Aucune donnée disponible"
          message="Aucune commission n'a été calculée pour la période sélectionnée."
          icon="calculator-outline"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Rapport de commission</Text>
            <Text style={styles.periode}>{formatPeriode()}</Text>
          </View>
          
          {renderRepartition()}
          {renderClientCommissions()}
          {renderActions()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  periode: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  repartitionContainer: {
    marginBottom: 24,
  },
  repartitionCard: {
    padding: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 4,
    textAlign: 'right',
  },
  clientsContainer: {
    marginBottom: 24,
  },
  clientCard: {
    marginBottom: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  clientId: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  clientDetails: {
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 8,
  },
});

export default CommissionVisualization;