// src/screens/SuperAdmin/CommissionTestScreen.js
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import superAdminService from '../../services/superAdminService';

const CommissionTestScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [typesOperation, setTypesOperation] = useState([]);
  const [parametres, setParametres] = useState([]);
  
  // Test form state
  const [agenceId, setAgenceId] = useState('1');
  const [montantTransaction, setMontantTransaction] = useState('1000');
  const [commissionCalculee, setCommissionCalculee] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTypesOperation(),
        loadParametres(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const loadTypesOperation = async () => {
    try {
      const result = await superAdminService.getTypesOperation();
      if (result.success) {
        setTypesOperation(result.data || []);
      } else {
        console.error('Erreur types opération:', result.error);
      }
    } catch (error) {
      console.error('Erreur loadTypesOperation:', error);
    }
  };

  const loadParametres = async () => {
    try {
      const result = await superAdminService.getAllParametresCommission();
      if (result.success) {
        setParametres(result.data || []);
      } else {
        console.error('Erreur paramètres:', result.error);
      }
    } catch (error) {
      console.error('Erreur loadParametres:', error);
    }
  };

  const testCalculCommission = async (typeOperation) => {
    try {
      const result = await superAdminService.calculerCommission(
        parseInt(agenceId),
        typeOperation,
        parseFloat(montantTransaction)
      );
      
      if (result.success) {
        setCommissionCalculee({
          typeOperation,
          montant: result.data,
          montantTransaction: parseFloat(montantTransaction)
        });
        Alert.alert(
          'Commission Calculée',
          `Type: ${typeOperation}\nTransaction: ${montantTransaction} FCFA\nCommission: ${result.data} FCFA`
        );
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Erreur calcul commission:', error);
      Alert.alert('Erreur', 'Erreur lors du calcul de commission');
    }
  };

  const renderTypeOperation = (type, index) => (
    <Card key={index} style={styles.typeCard}>
      <View style={styles.typeHeader}>
        <Text style={styles.typeName}>{type}</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testCalculCommission(type)}
        >
          <Ionicons name="calculator" size={16} color={theme.colors.white} />
          <Text style={styles.testButtonText}>Tester</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderParametre = (parametre, index) => (
    <Card key={index} style={styles.parametreCard}>
      <View style={styles.parametreHeader}>
        <Text style={styles.parametreTitle}>
          {parametre.typeOperation || 'N/A'} - Agence {parametre.agenceId || 'N/A'}
        </Text>
        <View style={[
          styles.statusBadge,
          parametre.actif ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {parametre.actif ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>
      
      <View style={styles.parametreDetails}>
        {parametre.pourcentageCommission && (
          <Text style={styles.detailText}>
            Pourcentage: {parametre.pourcentageCommission}%
          </Text>
        )}
        {parametre.montantFixe && (
          <Text style={styles.detailText}>
            Montant fixe: {parametre.montantFixe} FCFA
          </Text>
        )}
        {parametre.montantMinimum && (
          <Text style={styles.detailText}>
            Minimum: {parametre.montantMinimum} FCFA
          </Text>
        )}
        {parametre.montantMaximum && (
          <Text style={styles.detailText}>
            Maximum: {parametre.montantMaximum} FCFA
          </Text>
        )}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Test Commission"
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
        title="Test Commission"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Test Input Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🧪 Paramètres de Test</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ID Agence:</Text>
            <TextInput
              style={styles.textInput}
              value={agenceId}
              onChangeText={setAgenceId}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Montant Transaction (FCFA):</Text>
            <TextInput
              style={styles.textInput}
              value={montantTransaction}
              onChangeText={setMontantTransaction}
              placeholder="1000"
              keyboardType="numeric"
            />
          </View>

          {commissionCalculee && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>📊 Dernière Commission Calculée:</Text>
              <Text style={styles.resultText}>
                Type: {commissionCalculee.typeOperation}
              </Text>
              <Text style={styles.resultText}>
                Transaction: {commissionCalculee.montantTransaction} FCFA
              </Text>
              <Text style={styles.resultText}>
                Commission: {commissionCalculee.montant} FCFA
              </Text>
            </View>
          )}
        </Card>

        {/* Types d'opération */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔧 Types d'Opération Disponibles</Text>
          {typesOperation.length === 0 ? (
            <Text style={styles.emptyText}>Aucun type d'opération trouvé</Text>
          ) : (
            <View style={styles.typesList}>
              {typesOperation.map(renderTypeOperation)}
            </View>
          )}
        </Card>

        {/* Paramètres existants */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📋 Paramètres de Commission Existants</Text>
          {parametres.length === 0 ? (
            <Text style={styles.emptyText}>Aucun paramètre de commission trouvé</Text>
          ) : (
            <View style={styles.parametresList}>
              {parametres.map(renderParametre)}
            </View>
          )}
        </Card>

        {/* Actions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🚀 Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CommissionManagement')}
          >
            <Ionicons name="settings" size={20} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>
              Aller à la Gestion Complète
            </Text>
          </TouchableOpacity>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  resultContainer: {
    backgroundColor: theme.colors.successLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: theme.colors.success,
    marginBottom: 4,
  },
  typesList: {
    gap: 8,
  },
  typeCard: {
    padding: 12,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  testButtonText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '500',
  },
  parametresList: {
    gap: 12,
  },
  parametreCard: {
    padding: 12,
  },
  parametreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parametreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.white,
  },
  parametreDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default CommissionTestScreen;