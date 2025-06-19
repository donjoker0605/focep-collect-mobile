// src/screens/Collecteur/ClientListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { clientService } from '../../services';

const ClientListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Debug effect
  useEffect(() => {
    console.log('Current clients:', clients);
  }, [clients]);

  const handleClientPress = (client) => {
    navigation.navigate('ClientDetail', {
      client: client,
      clientId: client.id
    });
  };

  const loadClients = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const response = await clientService.getClientsByCollecteur(user.id);
      console.log('API Response:', response);
      
      // Convertir l'objet en tableau
      const clientsData = response.data ? Object.values(response.data) : [];
      console.log('Clients data:', clientsData);
      
      setClients(clientsData);
      
    } catch (err) {
      console.error('❌ Erreur chargement clients:', err);
      Alert.alert('Erreur', 'Impossible de charger les clients');
      setClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadClients();
    }, [user?.id, loadClients])
  );

  const renderClientItem = ({ item }) => {
    console.log('Rendering client:', item.id);
    return (
      <Card style={styles.clientCard}>
        <TouchableOpacity onPress={() => handleClientPress(item)}>
          <View style={styles.clientHeader}>
            <Text style={styles.clientName}>{item.prenom} {item.nom}</Text>
            <Text style={styles.clientAccount}>#{item.id}</Text>
          </View>
          <Text style={styles.clientCni}>{item.numeroCni}</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Mes Clients"
        showBackButton={false}
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('ClientAddEdit', { mode: 'add' })}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={clients}
            renderItem={renderClientItem}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => loadClients(true)} 
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
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
    padding: 16,
  },
  clientCard: {
    marginBottom: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  clientAccount: {
    color: theme.colors.textLight,
  },
  clientCni: {
    color: theme.colors.textLight,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.textLight,
  },
});

export default ClientListScreen;