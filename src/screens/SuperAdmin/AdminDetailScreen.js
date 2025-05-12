// src/screens/SuperAdmin/AdminDetailScreen.js
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

const AdminDetailScreen = ({ navigation, route }) => {
  const { admin } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [adminDetails, setAdminDetails] = useState(null);
  const [collecteurs, setCollecteurs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Si un admin est passé en paramètre, l'utiliser directement
    if (admin) {
      setAdminDetails(admin);
      // Simuler le chargement des collecteurs
      fetchCollecteurs();
    } else {
      // Afficher une erreur
      Alert.alert('Erreur', 'Aucun administrateur sélectionné');
      navigation.goBack();
    }
  }, [admin]);

  const fetchCollecteurs = () => {
    // Simuler une requête API
    setTimeout(() => {
      setCollecteurs([
        {
          id: 1,
          nom: 'Martin',
          prenom: 'Sophie',
          status: 'active',
          totalClients: 35,
        },
        {
          id: 2,
          nom: 'Dubois',
          prenom: 'Michel',
          status: 'active',
          totalClients: 28,
        },
        {
          id: 3,
          nom: 'Leroy',
          prenom: 'Thomas',
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
      fetchCollecteurs();
      setRefreshing(false);
    }, 1500);
  };

  const handleEditAdmin = () => {
    navigation.navigate('AdminEditScreen', { admin: adminDetails });
  };

  const handleToggleStatus = () => {
    if (!adminDetails) return;
    
    const newStatus = adminDetails.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';
    
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
          onPress: () => {
            setIsLoading(true);
            
            // Simuler une requête API
            setTimeout(() => {
              setAdminDetails({
                ...adminDetails,
                status: newStatus
              });
              
              setIsLoading(false);
              
              const message = newStatus === 'active'
                ? `Le compte de ${adminDetails.prenom} ${adminDetails.nom} a été activé avec succès.`
                : `Le compte de ${adminDetails.prenom} ${adminDetails.nom} a été désactivé avec succès.`;
              
              Alert.alert('Succès', message);
            }, 1000);
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
                <Text style={styles.adminEmail}>{adminDetails.adresseMail}</Text>
                
                <View style={[
                  styles.statusBadge,
                  adminDetails.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {adminDetails.status === 'active' ? 'Actif' : 'Inactif'}
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
                  <Text style={styles.detailValue}>{adminDetails.agence.nomAgence}</Text>
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
                adminDetails.status === 'active' ? styles.desactiverButton : styles.activerButton
              ]}
              onPress={handleToggleStatus}
            >
              <Ionicons
                name={adminDetails.status === 'active' ? "close-circle-outline" : "checkmark-circle-outline"}
                size={24}
                color={theme.colors.white}
              />
              <Text style={styles.actionButtonText}>
                {adminDetails.status === 'active' ? 'Désactiver le compte' : 'Activer le compte'}
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

export default AdminDetailScreen;