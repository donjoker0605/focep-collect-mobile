// src/screens/SuperAdmin/AdminDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import superAdminService from '../../services/superAdminService';

const AdminDetailScreen = ({ navigation, route }) => {
  const { admin } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [adminDetails, setAdminDetails] = useState(null);
  const [collecteurs, setCollecteurs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Charger les détails de l'admin
  const loadAdminDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
        setError(null);
      }

      console.log('📊 Chargement détails admin:', admin?.id);
      
      if (!admin?.id) {
        setError('ID administrateur manquant');
        Alert.alert('Erreur', 'Aucun administrateur sélectionné');
        navigation.goBack();
        return;
      }

      // Charger en parallèle les données de l'admin
      const [adminResult, collecteursResult] = await Promise.allSettled([
        superAdminService.getAdminDetails(admin.id),
        admin.agenceId ? superAdminService.getCollecteursByAgence(admin.agenceId) : Promise.resolve({ data: [] })
      ]);

      // Traiter les résultats
      if (adminResult.status === 'fulfilled' && adminResult.value.success) {
        setAdminDetails(adminResult.value.data);
      } else {
        // Utiliser les données passées en paramètre si l'API échoue
        setAdminDetails(admin);
      }

      if (collecteursResult.status === 'fulfilled' && collecteursResult.value.success) {
        setCollecteurs(collecteursResult.value.data || []);
      }

      // Vérifier s'il y a eu des erreurs critiques
      const hasErrors = [adminResult, collecteursResult]
        .some(result => result.status === 'rejected');

      if (hasErrors && showLoader) {
        console.warn('⚠️ Certaines données n\'ont pas pu être chargées');
      }

    } catch (error) {
      console.error('❌ Erreur chargement détails admin:', error);
      setError(error.message);
      // Utiliser les données passées en paramètre en cas d'erreur
      setAdminDetails(admin);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [admin, navigation]);

  // Charger au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      if (admin?.id) {
        loadAdminDetails();
      }
    }, [loadAdminDetails, admin])
  );

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdminDetails(false);
  }, [loadAdminDetails]);

  const handleEditAdmin = () => {
    navigation.navigate('AdminCreation', { 
      mode: 'edit', 
      admin: adminDetails 
    });
  };

  const handleToggleStatus = async () => {
    if (!adminDetails?.id) return;
    
    const newStatus = !adminDetails.active;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      `Confirmation`,
      `Êtes-vous sûr de vouloir ${action} le compte de ${adminDetails.prenom} ${adminDetails.nom} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const result = await superAdminService.toggleAdminStatus(adminDetails.id);
              
              if (result.success) {
                // Recharger les données pour avoir les dernières infos
                await loadAdminDetails(false);
                
                const message = newStatus
                  ? `Le compte de ${adminDetails.prenom} ${adminDetails.nom} a été activé avec succès.`
                  : `Le compte de ${adminDetails.prenom} ${adminDetails.nom} a été désactivé avec succès.`;
                
                Alert.alert('Succès', message);
              } else {
                Alert.alert('Erreur', result.error || 'Erreur lors du changement de statut');
              }
            } catch (error) {
              console.error('❌ Erreur toggle status admin:', error);
              Alert.alert('Erreur', 'Erreur lors du changement de statut');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewCollecteur = (collecteur) => {
    navigation.navigate('CollecteurDetail', { collecteur });
  };

  if (isLoading || !adminDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail de l'administrateur"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Détail de l'administrateur"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditAdmin}
          >
            <Ionicons name="create-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* Profil admin */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {adminDetails.prenom.charAt(0)}{adminDetails.nom.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.adminName}>{adminDetails.prenom} {adminDetails.nom}</Text>
                <Text style={styles.adminEmail}>{adminDetails.email || adminDetails.adresseMail}</Text>
                
                <View style={[
                  styles.statusBadge,
                  adminDetails.active ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {adminDetails.active ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Téléphone:</Text>
                  <Text style={styles.detailValue}>{adminDetails.telephone}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Agence:</Text>
                  <Text style={styles.detailValue}>{adminDetails.agenceNom || 'Non assigné'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Collecteurs:</Text>
                  <Text style={styles.detailValue}>{adminDetails.totalCollecteurs || collecteurs.length}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                adminDetails.active ? styles.desactiverButton : styles.activerButton
              ]}
              onPress={handleToggleStatus}
            >
              <Ionicons
                name={adminDetails.active ? "close-circle-outline" : "checkmark-circle-outline"}
                size={24}
                color={theme.colors.white}
              />
              <Text style={styles.actionButtonText}>
                {adminDetails.active ? 'Désactiver le compte' : 'Activer le compte'}
              </Text>
            </TouchableOpacity>
          </Card>
          
          {/* Liste des collecteurs */}
          <View style={styles.collecteursSection}>
            <Text style={styles.sectionTitle}>Collecteurs ({collecteurs.length})</Text>
            
            {collecteurs.length === 0 ? (
              <View style={styles.emptyCollecteurs}>
                <Ionicons name="people-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyCollecteursText}>
                  Aucun collecteur n'est assigné à cet administrateur
                </Text>
              </View>
            ) : (
              <>
                {collecteurs.map(collecteur => (
                  <Card key={collecteur.id} style={styles.collecteurCard}>
                    <View style={styles.collecteurHeader}>
                      <View style={styles.collecteurInfo}>
                        <Text style={styles.collecteurName}>{collecteur.prenom} {collecteur.nom}</Text>
                        <View style={[
                          styles.statusBadge, 
                          collecteur.status === 'active' ? styles.activeBadge : styles.inactiveBadge,
                          { alignSelf: 'flex-start', marginTop: 4 }
                        ]}>
                          <Text style={styles.statusText}>
                            {collecteur.status === 'active' ? 'Actif' : 'Inactif'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.collecteurStat}>
                        <Text style={styles.statValue}>{collecteur.totalClients}</Text>
                        <Text style={styles.statLabel}>clients</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewCollecteur(collecteur)}
                    >
                      <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
                      <Text style={styles.viewButtonText}>Voir détails</Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  editButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  activerButton: {
    backgroundColor: theme.colors.success,
  },
  desactiverButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: 8,
  },
  collecteursSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  emptyCollecteurs: {
    alignItems: 'center',
    padding: 32,
  },
  emptyCollecteursText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  collecteurCard: {
    marginBottom: 8,
  },
  collecteurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  collecteurStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AdminDetailScreen;