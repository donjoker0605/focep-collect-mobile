// src/screens/Collecteur/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { collecteurService } from '../../api/collecteurService';
import { useAuth } from '../../hooks/useAuth';

export default function CollecteurHomeScreen({ navigation }) {
  const [collecteurData, setCollecteurData] = useState(null);
  const [stats, setStats] = useState({
    totalCollecte: 0,
    nombreClients: 0,
    objectifMensuel: 0,
    progressionObjectif: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCollecteurData();
  }, []);

  const loadCollecteurData = async () => {
    try {
      // Charger les données du collecteur
      const result = await collecteurService.getCurrentCollecteur();
      if (result.success) {
        setCollecteurData(result.data);
        
        // Charger les statistiques
        await loadStats();
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Simuler le chargement des statistiques depuis l'API
      const clientsResult = await collecteurService.getClients();
      const transactionsResult = await collecteurService.getTransactions();
      
      if (clientsResult.success && transactionsResult.success) {
        const clients = clientsResult.data;
        const transactions = transactionsResult.data;
        
        // Calculer les statistiques
        const totalCollecte = transactions.content
          .filter(t => t.type === 'COLLECTE')
          .reduce((sum, t) => sum + t.montant, 0);
        
        setStats({
          totalCollecte,
          nombreClients: clients.length,
          objectifMensuel: collecteurData?.objectifMensuel || 0,
          progressionObjectif: collecteurData?.objectifMensuel 
            ? (totalCollecte / collecteurData.objectifMensuel) * 100 
            : 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollecteurData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={{ flex: 1, padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Title>Bienvenue, {user?.nom} {user?.prenom}</Title>
          <Paragraph>Solde principal: {collecteurData?.soldePrincipal || 0} FCFA</Paragraph>
        </Card.Content>
      </Card>
      
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Title>Statistiques du jour</Title>
          <Paragraph>Total collecté: {stats.totalCollecte} FCFA</Paragraph>
          <Paragraph>Nombre de clients: {stats.nombreClients}</Paragraph>
          <Paragraph>Progression objectif: {stats.progressionObjectif.toFixed(1)}%</Paragraph>
        </Card.Content>
      </Card>
      
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Title>Actions rapides</Title>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Collecte')}
          >
            Nouvelle collecte
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Retrait')}
          >
            Nouveau retrait
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}