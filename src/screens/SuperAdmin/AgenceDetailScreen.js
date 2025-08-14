// src/screens/SuperAdmin/AgenceDetailScreen.js
import React, { useState, useEffect } from 'react';
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
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';

const AgenceDetailScreen = ({ navigation, route }) => {
  const { agence } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [agenceDetails, setAgenceDetails] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [collecteurs, setCollecteurs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Si une agence est passée en paramètre, l'utiliser directement
    if (agence) {
      setAgenceDetails(agence);
      // Simuler le chargement des utilisateurs associés
      fetchAssociatedUsers();
    } else {
      // Afficher une erreur
      Alert.alert('Erreur', 'Aucune agence sélectionnée');
      navigation.goBack();
    }
  }, [agence]);

  const fetchAssociatedUsers = () => {
    // Simuler une requête API
    setTimeout(() => {
      setAdmins([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          status: 'active',
          totalCollecteurs: 5,
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Sophie',
          status: 'active',
          totalCollecteurs: 3,
        },
      ]);
      
      setCollecteurs([
        {
          id: 1,
          nom: 'Bernard',
          prenom: 'Michel',
          status: 'active',
          totalClients: 35,
        },
        {
          id: 2,
          nom: 'Thomas',
          prenom: 'Laura',
          status: 'active',
          totalClients: 28,
        },
        {
          id: 3,
          nom: 'Dubois',
          prenom: 'Pierre',
          status: 'inactive',
          totalClients: 0,
        },
      ]);
      
      setIsLoading(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simuler une requête API
    setTimeout(() => {
      fetchAssociatedUsers();
      setRefreshing(false);
    }, 1500);
  };

  const handleEditAgence = () => {
    navigation.navigate('AgenceEditScreen', { agence: agenceDetails });
  };

  const handleToggleStatus = () => {
    if (!agenceDetails) return;
    
    const newStatus = agenceDetails.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';
    
    Alert.alert(
      `Confirmation`,
      `Êtes-vous sûr de vouloir ${action} l'agence ${agenceDetails.nomAgence} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: () => {
            setIsLoading(true);
            
            // Simuler une requête API
            setTimeout(() => {
              setAgenceDetails({
                ...agenceDetails,
                status: newStatus
              });
              
              setIsLoading(false);
              
              const message = newStatus === 'active'
                ? `L'agence ${agenceDetails.nomAgence} a été activée avec succès.`
                : `L'agence ${agenceDetails.nomAgence} a été désactivée avec succès.`;
              
              Alert.alert('Succès', message);
            }, 1000);
          },
        },
      ]
    );
  };

  const handleAddAdmin = () => {
    navigation.navigate('AdminCreationScreen', { agenceId: agenceDetails.id });
  };

  const handleAddCollecteur = () => {
    navigation.navigate('CollecteurCreationScreen', { agenceId: agenceDetails.id });
  };

  const handleViewAdmin = (admin) => {
    navigation.navigate('AdminDetail', { admin });
  };

  const handleViewCollecteur = (collecteur) => {
    navigation.navigate('CollecteurDetail', { collecteur });
  };

  if (isLoading || !agenceDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail de l'agence"
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
        title="Détail de l'agence"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditAgence}
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
          {/* Détail de l'agence */}
          <Card style={styles.agenceCard}>
            <View style={styles.agenceHeader}>
              <View style={styles.agenceIconContainer}>
                <Ionicons name="business" size={32} color={theme.colors.primary} />
              </View>
              
              <View style={styles.agenceInfo}>
                <Text style={styles.agenceName}>{agenceDetails.nomAgence}</Text>
                <Text style={styles.agenceEmail}>{agenceDetails.email}</Text>
                
                <View style={[
                  styles.statusBadge,
                  agenceDetails.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {agenceDetails.status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Adresse:</Text>
                  <Text style={styles.detailValue}>{agenceDetails.adresse}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Téléphone:</Text>
                  <Text style={styles.detailValue}>{agenceDetails.telephone}</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
                  <Text style={styles.statValue}>
                    {admins.length}
                  </Text>
                  <Text style={styles.statLabel}>Administrateurs</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
                  <Text style={styles.statValue}>
                    {collecteurs.length}
                  </Text>
                  <Text style={styles.statLabel}>Collecteurs</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                agenceDetails.status === 'active' ? styles.desactiverButton : styles.activerButton
              ]}
              onPress={handleToggleStatus}
            >
              <Ionicons
                name={agenceDetails.status === 'active' ? "close-circle-outline" : "checkmark-circle-outline"}
                size={24}
                color={theme.colors.white}
              />
              <Text style={styles.actionButtonText}>
                {agenceDetails.status === 'active' ? 'Désactiver l\'agence' : 'Activer l\'agence'}
              </Text>
            </TouchableOpacity>
          </Card>
          
          {/* Liste des administrateurs */}
          <View style={styles.adminsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Administrateurs ({admins.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAdmin}
              >
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            
            {admins.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  Aucun administrateur n'est assigné à cette agence
                </Text>
              </View>
            ) : (
              <>
                {admins.map(admin => (
                  <Card key={admin.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{admin.prenom} {admin.nom}</Text>
                        <View style={[
                          styles.statusBadge, 
                          admin.status === 'active' ? styles.activeBadge : styles.inactiveBadge,
                          { alignSelf: 'flex-start', marginTop: 4 }
                        ]}>
                          <Text style={styles.statusText}>
                            {admin.status === 'active' ? 'Actif' : 'Inactif'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => handleViewAdmin(admin)}
                      >
                        <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </View>
          
          {/* Liste des collecteurs */}
          <View style={styles.collecteursSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Collecteurs ({collecteurs.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddCollecteur}
              >
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            
            {collecteurs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  Aucun collecteur n'est assigné à cette agence
                </Text>
              </View>
            ) : (
              <>
                {collecteurs.map(collecteur => (
                  <Card key={collecteur.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{collecteur.prenom} {collecteur.nom}</Text>
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
                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => handleViewCollecteur(collecteur)}
                      >
                        <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
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
  agenceCard: {
    marginBottom: 16,
  },
  agenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  agenceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  agenceInfo: {
    flex: 1,
  },
  agenceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  agenceEmail: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
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
  adminsSection: {
    marginBottom: 16,
  },
  collecteursSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  userCard: {
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  viewButton: {
    padding: 8,
  },
});

export default AgenceDetailScreen;