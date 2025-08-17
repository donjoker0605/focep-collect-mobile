// src/components/HistoriqueCommissions/HistoriqueCommissions.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Card from '../Card/Card';
import commissionService from '../../services/commissionService';
import { formatters } from '../../utils/formatters';
import colors from '../../theme/colors';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

/**
 * Composant pour afficher l'historique des calculs de commission d'un collecteur
 */
const HistoriqueCommissions = ({ collecteurId, collecteurNom, style, onHistoriqueLoaded }) => {
  const [historique, setHistorique] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Charger l'historique quand le collecteur change
  useEffect(() => {
    if (collecteurId) {
      loadHistorique();
      loadStats();
    } else {
      resetData();
    }
  }, [collecteurId]);

  const resetData = () => {
    setHistorique([]);
    setStats(null);
    setError(null);
    setExpanded(false);
  };

  const loadHistorique = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await commissionService.getHistoriqueCalculCommissions(collecteurId);
      
      if (response.success) {
        const historiqueData = response.data || [];
        console.log('🔄 Historique chargé:', historiqueData.length, 'éléments');
        setHistorique(historiqueData);
        
        // 🔥 NOUVEAU: Transmettre les données au parent
        if (onHistoriqueLoaded) {
          console.log('📤 Transmission historique au parent');
          onHistoriqueLoaded(historiqueData);
        }
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setError('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await commissionService.getStatsCommissions(collecteurId);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.warn('Erreur chargement stats:', err);
      // Stats non critiques, on continue sans erreur
    }
  };

  // 🔥 NOUVEAU: Hook pour rechargement automatique
  const triggerAutoRefresh = useAutoRefresh(() => {
    console.log('🔄 Auto-refresh déclenché dans HistoriqueCommissions');
    loadHistorique();
    loadStats();
  });

  const handleRefresh = () => {
    triggerAutoRefresh();
  };

  const formatStatut = (statut) => {
    const statusMap = {
      'CALCULE': { label: 'Calculé', color: colors.success },
      'ANNULE': { label: 'Annulé', color: colors.error },
      'PENDING': { label: 'En attente', color: colors.warning }
    };
    
    return statusMap[statut] || { label: statut, color: colors.textSecondary };
  };

  const formatPeriode = (dateDebut, dateFin) => {
    try {
      const debut = new Date(dateDebut).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      const fin = new Date(dateFin).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      return `${debut} → ${fin}`;
    } catch {
      return `${dateDebut} → ${dateFin}`;
    }
  };

  const formatDateCalcul = (dateCalcul) => {
    try {
      return new Date(dateCalcul).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateCalcul;
    }
  };

  const renderStatsSummary = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalCalculs || 0}</Text>
          <Text style={styles.statLabel}>Total calculs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.calculsNonRemuneres || 0}</Text>
          <Text style={styles.statLabel}>Non rémunérés</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatters.formatPercentage(stats.pourcentageRemunere || 0)}
          </Text>
          <Text style={styles.statLabel}>% Rémunéré</Text>
        </View>
      </View>
    );
  };

  const renderHistoriqueItem = (item, index) => {
    const statutInfo = formatStatut(item.statut);
    
    return (
      <View key={item.id || index} style={styles.historiqueItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemPeriode}>{formatPeriode(item.dateDebut, item.dateFin)}</Text>
            <Text style={styles.itemDate}>{formatDateCalcul(item.dateCalcul)}</Text>
          </View>
          <View style={styles.itemStatus}>
            <View style={[styles.statusBadge, { backgroundColor: statutInfo.color + '20' }]}>
              <Text style={[styles.statusText, { color: statutInfo.color }]}>
                {statutInfo.label}
              </Text>
            </View>
            {item.remunere && (
              <Icon name="paid" size={16} color={colors.success} style={styles.remuneratedIcon} />
            )}
          </View>
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Commission (S):</Text>
            <Text style={styles.detailValue}>
              {formatters.formatMoney(item.montantCommissionTotal || 0)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TVA (19,25%):</Text>
            <Text style={styles.detailValue}>
              {formatters.formatMoney(item.montantTvaTotal || 0)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Clients traités:</Text>
            <Text style={styles.detailValue}>{item.nombreClients || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!collecteurId) {
    return (
      <Card style={[styles.container, style]}>
        <Text style={styles.placeholderText}>
          Sélectionnez un collecteur pour voir son historique
        </Text>
      </Card>
    );
  }

  return (
    <Card style={[styles.container, style]}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="history" size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Historique Commissions</Text>
            {collecteurNom && (
              <Text style={styles.subtitle}>{collecteurNom}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Icon 
              name="refresh" 
              size={20} 
              color={loading ? colors.textSecondary : colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Icon 
              name={expanded ? "expand-less" : "expand-more"} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistiques résumées */}
      {renderStatsSummary()}

      {/* État de chargement */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      )}

      {/* Erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste historique */}
      {!loading && !error && expanded && (
        <ScrollView style={styles.historiqueList} showsVerticalScrollIndicator={false}>
          {historique.length > 0 ? (
            historique.map((item, index) => renderHistoriqueItem(item, index))
          ) : (
            <Text style={styles.emptyText}>Aucun calcul trouvé</Text>
          )}
        </ScrollView>
      )}

      {/* Résumé condensé quand fermé */}
      {!loading && !error && !expanded && historique.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {historique.length} calcul{historique.length > 1 ? 's' : ''} • 
            Dernier: {formatDateCalcul(historique[0]?.dateCalcul)}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerText: {
    marginLeft: 12,
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  refreshButton: {
    padding: 8
  },
  expandButton: {
    padding: 8
  },
  statsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: Platform.OS === 'web' ? 0 : 8
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    marginLeft: 8,
    color: colors.textSecondary
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 8
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: colors.error
  },
  retryButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.error + '20',
    borderRadius: 4
  },
  retryText: {
    color: colors.error,
    fontWeight: '500'
  },
  historiqueList: {
    maxHeight: Platform.OS === 'web' ? 400 : 300
  },
  historiqueItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  itemHeader: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'stretch',
    marginBottom: 8,
    gap: Platform.OS === 'web' ? 0 : 4
  },
  itemInfo: {
    flex: 1
  },
  itemPeriode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  itemDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500'
  },
  remuneratedIcon: {
    marginLeft: 4
  },
  itemDetails: {
    gap: 4
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text
  },
  summaryContainer: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 6
  },
  summaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: 20
  },
  placeholderText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: 20
  }
});

export default HistoriqueCommissions;