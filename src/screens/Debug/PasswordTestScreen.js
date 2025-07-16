// src/screens/Debug/PasswordTestScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { authService, collecteurService } from '../../services';

/**
 * 🧪 Écran de test et diagnostic des mots de passe
 * 
 * FONCTIONNALITÉS:
 * - Test de connexion avec différents mots de passe
 * - Diagnostic des problèmes de mots de passe
 * - Suggestions de correction
 * - Test de création de collecteur
 */
const PasswordTestScreen = ({ navigation }) => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [testPassword, setTestPassword] = useState('');
  const [collecteurs, setCollecteurs] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // États pour les différents types de tests
  const [loginTestResults, setLoginTestResults] = useState([]);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [creationTestResults, setCreationTestResults] = useState(null);

  useEffect(() => {
    loadCollecteurs();
  }, []);

  const loadCollecteurs = async () => {
    try {
      const response = await collecteurService.getAllCollecteurs();
      if (response.success) {
        setCollecteurs(response.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement collecteurs:', error);
    }
  };

  // 🧪 Test de connexion avec mots de passe communs
  const testCommonPasswords = async () => {
    if (!selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return;
    }

    setLoading(true);
    setLoginTestResults([]);

    const commonPasswords = [
      'ChangeMe123!',  // Le mot de passe forcé par le bug
      'password',
      '123456',
      'Test123!',
      'Collecteur123!',
      testPassword, // Mot de passe personnalisé
    ].filter(p => p.trim() !== '');

    console.log('🧪 Test des mots de passe communs pour:', selectedCollecteur.adresseMail);

    const results = [];
    
    for (const password of commonPasswords) {
      try {
        console.log(`🔑 Test mot de passe: ${password}`);
        
        // Tenter la connexion
        const loginResult = await authService.login(selectedCollecteur.adresseMail, password);
        
        results.push({
          password: password,
          success: loginResult.success,
          error: loginResult.error,
          timestamp: new Date().toISOString()
        });

        if (loginResult.success) {
          console.log('✅ Connexion réussie avec:', password);
          // Déconnexion immédiate
          await authService.logout();
          break; // Arrêter dès qu'on trouve le bon mot de passe
        } else {
          console.log('❌ Échec connexion avec:', password, '-', loginResult.error);
        }

      } catch (error) {
        console.error('Erreur test mot de passe:', error);
        results.push({
          password: password,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Pause entre les tentatives pour éviter le spam
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setLoginTestResults(results);
    setLoading(false);

    // Analyser les résultats
    const successfulLogin = results.find(r => r.success);
    if (successfulLogin) {
      Alert.alert(
        'Mot de passe trouvé !',
        `Le collecteur ${selectedCollecteur.prenom} ${selectedCollecteur.nom} peut se connecter avec le mot de passe: "${successfulLogin.password}"`
      );
    } else {
      Alert.alert(
        'Aucun mot de passe trouvé',
        'Aucun des mots de passe testés ne fonctionne. Le collecteur a probablement besoin d\'une réinitialisation.'
      );
    }
  };

  // 🏥 Diagnostic système complet
  const runSystemDiagnostic = async () => {
    setLoading(true);
    console.log('🏥 Lancement du diagnostic système');

    try {
      // Test de connectivité
      const connectivity = await testConnectivity();
      
      // Test des collecteurs problématiques
      const problematicCollecteurs = await identifyProblematicCollecteurs();
      
      // Recommandations
      const recommendations = generateRecommendations(problematicCollecteurs);

      const diagnostic = {
        timestamp: new Date().toISOString(),
        connectivity,
        problematicCollecteurs,
        recommendations,
        totalCollecteurs: collecteurs.length,
        healthScore: calculateHealthScore(problematicCollecteurs)
      };

      setDiagnosticResults(diagnostic);
      console.log('✅ Diagnostic système terminé:', diagnostic);

    } catch (error) {
      console.error('❌ Erreur diagnostic système:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🧪 Test de création d'un collecteur
  const testCollecteurCreation = async () => {
    setLoading(true);
    console.log('🧪 Test de création de collecteur');

    const testData = {
      nom: 'Test',
      prenom: 'Creation',
      adresseMail: `test.creation.${Date.now()}@collectfocep.com`,
      telephone: '600000000',
      numeroCni: '1234567890123',
      password: collecteurService.generateSecurePassword(),
      montantMaxRetrait: 100000,
      active: true
    };

    try {
      console.log('🔑 Données de test:', {
        ...testData,
        password: '[GÉNÉRÉ]'
      });

      // Tenter la création
      const creationResult = await collecteurService.createCollecteur(testData);
      
      if (creationResult.success) {
        console.log('✅ Création réussie:', creationResult);
        
        // Tester immédiatement la connexion
        const loginTest = await authService.login(testData.adresseMail, testData.password);
        
        const testResults = {
          creation: creationResult,
          login: loginTest,
          testData: {
            ...testData,
            password: testData.password // Révéler pour le test
          },
          timestamp: new Date().toISOString()
        };

        setCreationTestResults(testResults);

        if (loginTest.success) {
          await authService.logout();
          Alert.alert(
            'Test réussi !',
            `Collecteur créé et connexion testée avec succès.\n\nEmail: ${testData.adresseMail}\nMot de passe: ${testData.password}`
          );
        } else {
          Alert.alert(
            'Problème détecté',
            `Collecteur créé mais connexion échouée.\nErreur: ${loginTest.error}`
          );
        }

      } else {
        console.log('❌ Échec création:', creationResult);
        Alert.alert('Échec création', creationResult.error);
      }

    } catch (error) {
      console.error('❌ Erreur test création:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Fonctions utilitaires
  const testConnectivity = async () => {
    try {
      const response = await collecteurService.getAllCollecteurs({ page: 0, size: 1 });
      return {
        success: response.success,
        status: 'OK',
        message: 'API accessible'
      };
    } catch (error) {
      return {
        success: false,
        status: 'ERROR',
        message: error.message
      };
    }
  };

  const identifyProblematicCollecteurs = async () => {
    const problematic = [];
    
    for (const collecteur of collecteurs.slice(0, 5)) { // Tester seulement les 5 premiers
      try {
        const loginTest = await authService.login(collecteur.adresseMail, 'ChangeMe123!');
        if (loginTest.success) {
          await authService.logout();
          problematic.push({
            ...collecteur,
            issue: 'Mot de passe par défaut détecté',
            severity: 'HIGH'
          });
        }
      } catch (error) {
        // Ignorer les erreurs de connexion
      }
    }

    return problematic;
  };

  const generateRecommendations = (problematicCollecteurs) => {
    const recommendations = [
      '🔧 Corriger le bug dans CollecteurServiceImpl.saveCollecteur()',
      '🔑 Réinitialiser les mots de passe des collecteurs affectés',
      '🧪 Implémenter des tests automatisés pour la création',
    ];

    if (problematicCollecteurs.length > 0) {
      recommendations.unshift(
        `🚨 ${problematicCollecteurs.length} collecteur(s) avec mot de passe par défaut détecté(s)`
      );
    }

    return recommendations;
  };

  const calculateHealthScore = (problematicCollecteurs) => {
    if (collecteurs.length === 0) return 100;
    const healthyCount = collecteurs.length - problematicCollecteurs.length;
    return Math.round((healthyCount / collecteurs.length) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Mots de Passe</Text>
        <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}>
          <Ionicons 
            name={showAdvanced ? "settings" : "settings-outline"} 
            size={24} 
            color={theme.colors.white} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Section de sélection du collecteur */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🎯 Sélection du collecteur</Text>
          
          <Text style={styles.label}>Collecteur à tester:</Text>
          <View style={styles.pickerContainer}>
            {collecteurs.map((collecteur) => (
              <TouchableOpacity
                key={collecteur.id}
                style={[
                  styles.collecteurItem,
                  selectedCollecteur?.id === collecteur.id && styles.selectedCollecteur
                ]}
                onPress={() => setSelectedCollecteur(collecteur)}
              >
                <Text style={styles.collecteurName}>
                  {collecteur.prenom} {collecteur.nom}
                </Text>
                <Text style={styles.collecteurEmail}>{collecteur.adresseMail}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Mot de passe personnalisé (optionnel):</Text>
          <TextInput
            style={styles.textInput}
            value={testPassword}
            onChangeText={setTestPassword}
            placeholder="Mot de passe à tester..."
            secureTextEntry
          />
        </Card>

        {/* Section des tests */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🧪 Tests disponibles</Text>
          
          <Button
            title="Test Mots de Passe Communs"
            onPress={testCommonPasswords}
            loading={loading}
            disabled={!selectedCollecteur}
            style={styles.testButton}
            icon="key"
          />

          <Button
            title="Diagnostic Système"
            onPress={runSystemDiagnostic}
            loading={loading}
            style={[styles.testButton, styles.diagnosticButton]}
            icon="medical"
          />

          <Button
            title="Test Création Collecteur"
            onPress={testCollecteurCreation}
            loading={loading}
            style={[styles.testButton, styles.creationButton]}
            icon="person-add"
          />
        </Card>

        {/* Options avancées */}
        {showAdvanced && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>⚙️ Options avancées</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Logs détaillés</Text>
              <Switch value={true} disabled />
            </View>

            <Button
              title="Recharger Collecteurs"
              onPress={loadCollecteurs}
              style={styles.reloadButton}
              icon="refresh"
            />
          </Card>
        )}

        {/* Résultats des tests de connexion */}
        {loginTestResults.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>🔑 Résultats tests de connexion</Text>
            
            {loginTestResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultPassword}>"{result.password}"</Text>
                  <Ionicons 
                    name={result.success ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={result.success ? theme.colors.success : theme.colors.error}
                  />
                </View>
                {!result.success && (
                  <Text style={styles.resultError}>{result.error}</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Résultats du diagnostic */}
        {diagnosticResults && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>🏥 Diagnostic système</Text>
            
            <View style={styles.diagnosticStats}>
              <Text style={styles.statItem}>
                Score de santé: {diagnosticResults.healthScore}%
              </Text>
              <Text style={styles.statItem}>
                Collecteurs problématiques: {diagnosticResults.problematicCollecteurs?.length || 0}
              </Text>
            </View>

            <Text style={styles.subTitle}>Recommandations:</Text>
            {diagnosticResults.recommendations?.map((rec, index) => (
              <Text key={index} style={styles.recommendation}>{rec}</Text>
            ))}
          </Card>
        )}

        {/* Résultats du test de création */}
        {creationTestResults && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>🧪 Test de création</Text>
            
            <View style={styles.creationResult}>
              <Text style={styles.resultLabel}>Création:</Text>
              <Text style={[
                styles.resultValue,
                { color: creationTestResults.creation.success ? theme.colors.success : theme.colors.error }
              ]}>
                {creationTestResults.creation.success ? 'Réussie' : 'Échouée'}
              </Text>
            </View>

            <View style={styles.creationResult}>
              <Text style={styles.resultLabel}>Connexion:</Text>
              <Text style={[
                styles.resultValue,
                { color: creationTestResults.login.success ? theme.colors.success : theme.colors.error }
              ]}>
                {creationTestResults.login.success ? 'Réussie' : 'Échouée'}
              </Text>
            </View>

            {creationTestResults.login.success && (
              <View style={styles.successInfo}>
                <Text style={styles.successTitle}>✅ Test réussi !</Text>
                <Text style={styles.successDetail}>
                  Email: {creationTestResults.testData.adresseMail}
                </Text>
                <Text style={styles.successDetail}>
                  Mot de passe: {creationTestResults.testData.password}
                </Text>
              </View>
            )}
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Test en cours...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  collecteurItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  selectedCollecteur: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  collecteurName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  collecteurEmail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  testButton: {
    marginBottom: 12,
  },
  diagnosticButton: {
    backgroundColor: theme.colors.warning,
  },
  creationButton: {
    backgroundColor: theme.colors.success,
  },
  reloadButton: {
    backgroundColor: theme.colors.info,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPassword: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.text,
  },
  resultError: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  diagnosticStats: {
    marginBottom: 16,
  },
  statItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  creationResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  successInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: 8,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
    marginBottom: 8,
  },
  successDetail: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.white,
    marginTop: 8,
    fontSize: 14,
  },
});

export default PasswordTestScreen;