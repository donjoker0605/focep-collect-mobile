// src/screens/Admin/CollecteurCreationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { collecteurService, commissionService } from '../../services';
import { useAuth } from '../../hooks/useAuth';

const CollecteurCreationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isEditMode = route.params?.mode === 'edit';
  const existingCollecteur = route.params?.collecteur;

  // États du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresseMail: '',
    telephone: '',
    numeroCni: '',
    password: '',
    confirmPassword: '',
    newPassword: '', // 🔥 NOUVEAU: Pour la modification
    confirmNewPassword: '', // 🔥 NOUVEAU: Pour la modification
    montantMaxRetrait: '100000',
    active: true,
  });

  // États des paramètres de commission
  const [defineCommission, setDefineCommission] = useState(false);
  const [commissionParams, setCommissionParams] = useState({
    tauxCommission: '2.5',
    typeCalcul: 'pourcentage',
    periodicite: 'mensuelle',
    montantMinimum: '',
    montantMaximum: '',
  });

  // 🔥 NOUVEAU: État pour le changement de mot de passe en mode édition
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Charger les données en mode édition
  useEffect(() => {
    if (isEditMode && existingCollecteur) {
      setFormData({
        nom: existingCollecteur.nom || '',
        prenom: existingCollecteur.prenom || '',
        adresseMail: existingCollecteur.adresseMail || '',
        telephone: existingCollecteur.telephone || '',
        numeroCni: existingCollecteur.numeroCni || '',
        montantMaxRetrait: existingCollecteur.montantMaxRetrait?.toString() || '100000',
        active: existingCollecteur.active ?? true,
        password: '',
        confirmPassword: '',
        newPassword: '', // 🔥 NOUVEAU
        confirmNewPassword: '', // 🔥 NOUVEAU
      });
    }
  }, [isEditMode, existingCollecteur]);

  const validateForm = () => {
    const newErrors = {};

    // Validation des champs obligatoires
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est obligatoire';
    } else if (!/^6[0-9]{8}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format invalide (ex: 600000000)';
    }
    if (!formData.numeroCni.trim()) {
      newErrors.numeroCni = 'Le numéro CNI est obligatoire';
    } else if (formData.numeroCni.length < 10) {
      newErrors.numeroCni = 'Le numéro CNI doit avoir au moins 10 caractères';
    }

    // Validation email
    if (!isEditMode || formData.adresseMail !== existingCollecteur?.adresseMail) {
      if (!formData.adresseMail.trim()) {
        newErrors.adresseMail = 'L\'email est obligatoire';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adresseMail)) {
        newErrors.adresseMail = 'Format d\'email invalide';
      }
    }

    // 🔥 CORRECTION: Validation mot de passe selon le mode
    if (!isEditMode) {
      // CRÉATION: Mot de passe obligatoire
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est obligatoire';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit avoir au moins 6 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else {
      // MODIFICATION: Nouveau mot de passe optionnel mais si fourni, doit être valide
      if (showPasswordChange) {
        if (!formData.newPassword) {
          newErrors.newPassword = 'Le nouveau mot de passe est obligatoire';
        } else if (formData.newPassword.length < 6) {
          newErrors.newPassword = 'Le mot de passe doit avoir au moins 6 caractères';
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
          newErrors.confirmNewPassword = 'Les mots de passe ne correspondent pas';
        }
      }
    }

    // Validation montant max retrait
    const montantMax = parseFloat(formData.montantMaxRetrait);
    if (isNaN(montantMax) || montantMax <= 0) {
      newErrors.montantMaxRetrait = 'Le montant doit être supérieur à 0';
    }

    // Validation paramètres commission si activés
    if (defineCommission) {
      const taux = parseFloat(commissionParams.tauxCommission);
      if (isNaN(taux) || taux <= 0) {
        newErrors.tauxCommission = 'Le taux doit être supérieur à 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    const actionText = isEditMode ? 'Enregistrer les modifications' : `Créer le collecteur ${formData.prenom} ${formData.nom}`;
    const confirmText = showPasswordChange && isEditMode ? 
      'Voulez-vous enregistrer les modifications (y compris le nouveau mot de passe) ?' :
      isEditMode ? 'Voulez-vous enregistrer les modifications ?' : actionText + ' ?';

    Alert.alert(
      isEditMode ? 'Confirmation' : 'Créer un collecteur',
      confirmText,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: executeSubmit }
      ]
    );
  };

  const executeSubmit = async () => {
    try {
      setLoading(true);

      if (isEditMode) {
        // 🔥 CORRECTION: Mode modification
        const updateData = {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          telephone: formData.telephone.trim(),
          numeroCni: formData.numeroCni.trim(),
          montantMaxRetrait: parseFloat(formData.montantMaxRetrait),
          active: formData.active,
        };

        // 🔥 NOUVEAU: Ajouter le nouveau mot de passe si fourni
        if (showPasswordChange && formData.newPassword) {
          updateData.newPassword = formData.newPassword;
        }

        const response = await collecteurService.updateCollecteur(existingCollecteur.id, updateData);

        if (response.success) {
          Alert.alert(
            'Succès',
            showPasswordChange ? 
              'Collecteur et mot de passe modifiés avec succès' : 
              'Collecteur modifié avec succès',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                  if (route.params?.onRefresh) {
                    route.params.onRefresh();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Erreur', response.error || 'Une erreur est survenue');
        }

      } else {
        // 🔥 CORRECTION: Mode création - S'assurer que le mot de passe est envoyé
        const submitData = {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          adresseMail: formData.adresseMail.trim().toLowerCase(),
          telephone: formData.telephone.trim(),
          numeroCni: formData.numeroCni.trim(),
          password: formData.password, // 🔥 CRITIQUE: Mot de passe obligatoire
          montantMaxRetrait: parseFloat(formData.montantMaxRetrait),
          active: formData.active,
          // NE PAS envoyer l'agenceId - elle sera assignée automatiquement côté backend
        };

        console.log('🔑 Envoi mot de passe pour création:', !!submitData.password);

        const response = await collecteurService.createCollecteur(submitData);

        if (response.success) {
          // Si paramètres de commission définis
          if (defineCommission && response.data?.id) {
            try {
              await commissionService.updateCollecteurCommissionParams(response.data.id, {
                tauxCommission: parseFloat(commissionParams.tauxCommission),
                typeCalcul: commissionParams.typeCalcul,
                periodicite: commissionParams.periodicite,
                montantMinimum: commissionParams.montantMinimum ? parseFloat(commissionParams.montantMinimum) : null,
                montantMaximum: commissionParams.montantMaximum ? parseFloat(commissionParams.montantMaximum) : null,
              });
            } catch (commissionError) {
              console.error('Erreur lors de la définition des commissions:', commissionError);
              // Ne pas bloquer la création du collecteur
            }
          }

          Alert.alert(
            'Succès',
            'Collecteur créé avec succès',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                  // Rafraîchir la liste si nécessaire
                  if (route.params?.onRefresh) {
                    route.params.onRefresh();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Erreur', response.error || 'Une erreur est survenue');
        }
      }

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NOUVELLE FONCTION: Réinitialisation rapide du mot de passe
  const handleQuickPasswordReset = () => {
    Alert.prompt(
      'Réinitialiser le mot de passe',
      'Entrez le nouveau mot de passe pour ce collecteur:',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          onPress: async (newPassword) => {
            if (!newPassword || newPassword.length < 6) {
              Alert.alert('Erreur', 'Le mot de passe doit avoir au moins 6 caractères');
              return;
            }

            try {
              setLoading(true);
              // Utiliser l'endpoint spécialisé pour la réinitialisation
              const response = await collecteurService.resetPassword(existingCollecteur.id, {
                newPassword: newPassword
              });

              if (response.success) {
                Alert.alert(
                  'Succès',
                  `Mot de passe réinitialisé avec succès.\n\nNouveau mot de passe: ${newPassword}\n\nCommuniquez ce mot de passe au collecteur.`
                );
              } else {
                Alert.alert('Erreur', response.error || 'Erreur lors de la réinitialisation');
              }
            } catch (error) {
              console.error('Erreur réinitialisation:', error);
              Alert.alert('Erreur', error.message || 'Erreur lors de la réinitialisation');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur lors de la modification
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCommissionParamChange = (field, value) => {
    setCommissionParams(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title={isEditMode ? 'Modifier collecteur' : 'Nouveau collecteur'}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Informations personnelles */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <Input
            label="Nom"
            value={formData.nom}
            onChangeText={(value) => handleInputChange('nom', value)}
            error={errors.nom}
            placeholder="Nom du collecteur"
            required
          />
          
          <Input
            label="Prénom"
            value={formData.prenom}
            onChangeText={(value) => handleInputChange('prenom', value)}
            error={errors.prenom}
            placeholder="Prénom du collecteur"
            required
          />
          
          <Input
            label="Numéro CNI"
            value={formData.numeroCni}
            onChangeText={(value) => handleInputChange('numeroCni', value)}
            error={errors.numeroCni}
            placeholder="Ex: 123456789012"
            keyboardType="numeric"
            required
          />
          
          <Input
            label="Téléphone"
            value={formData.telephone}
            onChangeText={(value) => handleInputChange('telephone', value)}
            error={errors.telephone}
            placeholder="Ex: 600000000"
            keyboardType="phone-pad"
            required
          />
        </Card>

        {/* Informations de connexion */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informations de connexion</Text>
          
          <Input
            label="Adresse email"
            value={formData.adresseMail}
            onChangeText={(value) => handleInputChange('adresseMail', value)}
            error={errors.adresseMail}
            placeholder="email@collectfocep.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isEditMode}
            required
          />
          
          {!isEditMode && (
            <>
              <Input
                label="Mot de passe"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                placeholder="Minimum 6 caractères"
                secureTextEntry
                required
              />
              
              <Input
                label="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                placeholder="Retapez le mot de passe"
                secureTextEntry
                required
              />
            </>
          )}

          {/* 🔥 NOUVEAU: Section mot de passe en mode édition */}
          {isEditMode && (
            <>
              <View style={styles.passwordSection}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.passwordTitle}>Gestion du mot de passe</Text>
                  <TouchableOpacity
                    style={styles.quickResetButton}
                    onPress={handleQuickPasswordReset}
                  >
                    <Ionicons name="key" size={16} color={theme.colors.white} />
                    <Text style={styles.quickResetText}>Réinitialiser</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Changer le mot de passe</Text>
                  <Switch
                    value={showPasswordChange}
                    onValueChange={setShowPasswordChange}
                    trackColor={{ false: theme.colors.lightGray, true: theme.colors.primary }}
                    thumbColor={showPasswordChange ? theme.colors.white : theme.colors.gray}
                  />
                </View>

                {showPasswordChange && (
                  <>
                    <Input
                      label="Nouveau mot de passe"
                      value={formData.newPassword}
                      onChangeText={(value) => handleInputChange('newPassword', value)}
                      error={errors.newPassword}
                      placeholder="Minimum 6 caractères"
                      secureTextEntry
                      required
                    />
                    
                    <Input
                      label="Confirmer le nouveau mot de passe"
                      value={formData.confirmNewPassword}
                      onChangeText={(value) => handleInputChange('confirmNewPassword', value)}
                      error={errors.confirmNewPassword}
                      placeholder="Retapez le nouveau mot de passe"
                      secureTextEntry
                      required
                    />
                  </>
                )}
              </View>
            </>
          )}
        </Card>

        {/* Paramètres du compte */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Paramètres du compte</Text>
          
          {/* Information sur l'agence */}
          <View style={styles.infoBox}>
            <Ionicons name="business" size={20} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Agence</Text>
              <Text style={styles.infoValue}>
                {user?.agenceName || `Agence ${user?.agenceId || 'principale'}`}
              </Text>
              <Text style={styles.infoNote}>
                {isEditMode ? 'Ne peut pas être modifiée' : 'Assignée automatiquement'}
              </Text>
            </View>
          </View>
          
          <Input
            label="Montant maximum de retrait (FCFA)"
            value={formData.montantMaxRetrait}
            onChangeText={(value) => handleInputChange('montantMaxRetrait', value)}
            error={errors.montantMaxRetrait}
            placeholder="Ex: 100000"
            keyboardType="numeric"
            required
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Compte actif</Text>
            <Switch
              value={formData.active}
              onValueChange={(value) => handleInputChange('active', value)}
              trackColor={{ false: theme.colors.lightGray, true: theme.colors.primary }}
              thumbColor={formData.active ? theme.colors.white : theme.colors.gray}
            />
          </View>
        </Card>

        {/* Paramètres de commission (uniquement en création) */}
        {!isEditMode && (
          <Card style={styles.card}>
            <View style={styles.commissionHeader}>
              <Text style={styles.sectionTitle}>Paramètres de commission</Text>
              <Switch
                value={defineCommission}
                onValueChange={setDefineCommission}
                trackColor={{ false: theme.colors.lightGray, true: theme.colors.primary }}
                thumbColor={defineCommission ? theme.colors.white : theme.colors.gray}
              />
            </View>
            
            {defineCommission && (
              <>
                <Text style={styles.commissionNote}>
                  Définir des paramètres spécifiques pour ce collecteur
                </Text>
                
                <View style={styles.radioGroup}>
                  <Text style={styles.label}>Type de calcul</Text>
                  <View style={styles.radioOptions}>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => handleCommissionParamChange('typeCalcul', 'pourcentage')}
                    >
                      <View style={[styles.radio, commissionParams.typeCalcul === 'pourcentage' && styles.radioActive]}>
                        {commissionParams.typeCalcul === 'pourcentage' && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioText}>Pourcentage</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => handleCommissionParamChange('typeCalcul', 'fixe')}
                    >
                      <View style={[styles.radio, commissionParams.typeCalcul === 'fixe' && styles.radioActive]}>
                        {commissionParams.typeCalcul === 'fixe' && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioText}>Montant fixe</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Input
                  label={commissionParams.typeCalcul === 'pourcentage' ? "Taux (%)" : "Montant (FCFA)"}
                  value={commissionParams.tauxCommission}
                  onChangeText={(value) => handleCommissionParamChange('tauxCommission', value)}
                  error={errors.tauxCommission}
                  placeholder={commissionParams.typeCalcul === 'pourcentage' ? "Ex: 2.5" : "Ex: 5000"}
                  keyboardType="numeric"
                />
                
                {commissionParams.typeCalcul === 'pourcentage' && (
                  <>
                    <Input
                      label="Montant minimum (FCFA)"
                      value={commissionParams.montantMinimum}
                      onChangeText={(value) => handleCommissionParamChange('montantMinimum', value)}
                      placeholder="Optionnel"
                      keyboardType="numeric"
                    />
                    
                    <Input
                      label="Montant maximum (FCFA)"
                      value={commissionParams.montantMaximum}
                      onChangeText={(value) => handleCommissionParamChange('montantMaximum', value)}
                      placeholder="Optionnel"
                      keyboardType="numeric"
                    />
                  </>
                )}
              </>
            )}
          </Card>
        )}

        {/* Bouton de soumission */}
        <Button
          title={
            isEditMode 
              ? (showPasswordChange ? "Enregistrer avec nouveau mot de passe" : "Enregistrer les modifications")
              : "Créer le collecteur"
          }
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 2,
  },
  infoNote: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  // 🔥 NOUVEAUX STYLES POUR LA GESTION DU MOT DE PASSE
  passwordSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quickResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickResetText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commissionNote: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  radioGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  radioOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  submitButton: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
});

export default CollecteurCreationScreen;