// src/screens/SuperAdmin/CollecteurCreationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Header from '../../components/Header/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import superAdminService from '../../services/superAdminService';
import theme from '../../theme';

// Schéma de validation
const collecteurSchema = yup.object().shape({
  nom: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom est requis'),
  prenom: yup
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne doit pas dépasser 50 caractères')
    .required('Le prénom est requis'),
  numeroCni: yup
    .string()
    .min(8, 'Le numéro CNI doit contenir au moins 8 caractères')
    .max(20, 'Le numéro CNI ne doit pas dépasser 20 caractères')
    .required('Le numéro CNI est requis'),
  adresseMail: yup
    .string()
    .email('Format email invalide')
    .required('L\'email est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[\s]?[679]\d{8}$/, 'Format de téléphone invalide (exemple: +237XXXXXXXXX)')
    .required('Le téléphone est requis'),
  agenceId: yup
    .number()
    .positive('Veuillez sélectionner une agence')
    .required('L\'agence est requise'),
  adminId: yup
    .number()
    .transform((value, originalValue) => {
      // Si c'est une chaîne vide, null ou undefined, retourner null
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return null;
      }
      return value;
    })
    .nullable()
    .when('$isEdit', {
      is: false, // En mode création, adminId est requis
      then: (schema) => schema.required('L\'administrateur responsable est requis'),
      otherwise: (schema) => schema.notRequired() // En mode édition, on accepte null temporairement
    }),
  montantMaxRetrait: yup
    .number()
    .min(0, 'Le montant doit être positif')
    .max(10000000, 'Le montant ne doit pas dépasser 10 000 000')
    .required('Le montant maximum de retrait est requis'),
  ancienneteEnMois: yup
    .number()
    .min(0, 'L\'ancienneté doit être positive')
    .max(600, 'L\'ancienneté ne doit pas dépasser 600 mois')
    .required('L\'ancienneté est requise'),
});

const CollecteurCreationScreen = ({ navigation, route }) => {
  const isEditMode = route.params?.mode === 'edit';
  const collecteurToEdit = route.params?.collecteur;
  
  // Logs pour debug uniquement au mount initial
  useEffect(() => {
    console.log('🔧 CollecteurCreationScreen - Mode:', isEditMode ? 'EDIT' : 'CREATE');
    console.log('🔧 CollecteurCreationScreen - collecteur:', collecteurToEdit);
  }, []); // Seulement au premier rendu
  const [loading, setLoading] = useState(false);
  const [agences, setAgences] = useState([]);
  const [loadingAgences, setLoadingAgences] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [manualPassword, setManualPassword] = useState('');

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(collecteurSchema),
    context: { isEdit: isEditMode }, // Passer le mode au contexte pour validation
    defaultValues: {
      nom: '',
      prenom: '',
      numeroCni: '',
      adresseMail: '',
      telephone: '',
      agenceId: '',
      adminId: '',
      montantMaxRetrait: 50000,
      ancienneteEnMois: 0,
      active: true,
      ...( isEditMode && collecteurToEdit ? {
        nom: collecteurToEdit.nom || '',
        prenom: collecteurToEdit.prenom || '',
        numeroCni: collecteurToEdit.numeroCni || '',
        adresseMail: collecteurToEdit.adresseMail || '',
        telephone: collecteurToEdit.telephone || '',
        agenceId: collecteurToEdit.agenceId || '',
        adminId: collecteurToEdit.adminId ? collecteurToEdit.adminId.toString() : '',
        montantMaxRetrait: collecteurToEdit.montantMaxRetrait || 50000,
        ancienneteEnMois: collecteurToEdit.ancienneteEnMois || 0,
        active: collecteurToEdit.active !== false,
      } : {})
    }
  });

  const selectedAgenceId = watch('agenceId');

  useEffect(() => {
    loadAgences();
  }, []);

  useEffect(() => {
    if (selectedAgenceId) {
      loadAdminsByAgence(selectedAgenceId);
    }
  }, [selectedAgenceId]);

  // Charger les données du collecteur une seule fois
  useEffect(() => {
    if (isEditMode && collecteurToEdit && collecteurToEdit.id) {
      console.log('🔍 Debug collecteur à éditer:', collecteurToEdit);
      console.log('🔍 agenceId:', collecteurToEdit.agenceId);
      console.log('🔍 adminId:', collecteurToEdit.adminId);
      
      // Pré-sélectionner l'agence si disponible et charger ses admins
      if (collecteurToEdit.agenceId) {
        console.log('✅ Pré-sélection agence:', collecteurToEdit.agenceId);
        setValue('agenceId', collecteurToEdit.agenceId.toString());
        loadAdminsByAgence(collecteurToEdit.agenceId);
      }
      // Pré-sélectionner l'admin responsable si disponible
      if (collecteurToEdit.adminId) {
        console.log('✅ Pré-sélection admin:', collecteurToEdit.adminId);
        setValue('adminId', collecteurToEdit.adminId.toString());
      } else {
        console.log('❌ Pas d\'adminId trouvé dans collecteurToEdit');
      }
    }
  }, [isEditMode, collecteurToEdit?.id]); // Dépend seulement de l'ID du collecteur

  const loadAgences = async () => {
    setLoadingAgences(true);
    try {
      const result = await superAdminService.getAllAgences();
      if (result.success) {
        setAgences(result.data || []);
      } else {
        console.error('Erreur chargement agences:', result.error);
        Alert.alert('Erreur', 'Impossible de charger les agences');
      }
    } catch (error) {
      console.error('Erreur loadAgences:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des agences');
    } finally {
      setLoadingAgences(false);
    }
  };

  const loadAdminsByAgence = async (agenceId) => {
    console.log('👥 Chargement admins pour agence:', agenceId);
    try {
      const result = await superAdminService.getAdminsByAgence(agenceId);
      console.log('👥 Résultat admins:', result);
      if (result.success) {
        console.log('👥 Admins chargés:', result.data?.length || 0, 'admins');
        setAdmins(result.data || []);
        
        // Si on est en mode édition et qu'on a un adminId, pré-sélectionner après chargement
        if (isEditMode && collecteurToEdit?.adminId) {
          setTimeout(() => {
            console.log('⏳ Pré-sélection admin différée:', collecteurToEdit.adminId);
            setValue('adminId', collecteurToEdit.adminId.toString());
          }, 100);
        }
      } else {
        console.error('Erreur chargement admins:', result.error);
        setAdmins([]);
      }
    } catch (error) {
      console.error('Erreur loadAdminsByAgence:', error);
      setAdmins([]);
    }
  };

  const onSubmit = async (data) => {
    console.log('📝 Soumission formulaire - Mode:', isEditMode ? 'EDIT' : 'CREATE');
    console.log('📝 Données formulaire:', data);
    
    setLoading(true);
    try {
      const collecteurData = {
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        numeroCni: data.numeroCni.trim(),
        adresseMail: data.adresseMail.trim().toLowerCase(),
        telephone: data.telephone.trim(),
        agenceId: parseInt(data.agenceId),
        adminId: data.adminId ? parseInt(data.adminId) : null,
        montantMaxRetrait: parseFloat(data.montantMaxRetrait),
        ancienneteEnMois: parseInt(data.ancienneteEnMois),
        active: data.active,
        role: 'COLLECTEUR'
      };

      console.log('📝 Données à envoyer:', collecteurData);

      // Génération d'un mot de passe temporaire pour les nouveaux collecteurs
      if (!isEditMode) {
        collecteurData.password = generateTemporaryPassword();
      }

      let result;
      if (isEditMode) {
        console.log('🔄 Appel updateCollecteur avec ID:', collecteurToEdit.id);
        result = await superAdminService.updateCollecteur(collecteurToEdit.id, collecteurData);
        console.log('🔄 Résultat updateCollecteur:', result);
      } else {
        console.log('➕ Appel createCollecteur');
        result = await superAdminService.createCollecteur(collecteurData);
        console.log('➕ Résultat createCollecteur:', result);
      }

      if (result.success) {
        const message = isEditMode 
          ? `Le collecteur ${data.nom} ${data.prenom} a été mis à jour avec succès.`
          : `Le collecteur ${data.nom} ${data.prenom} a été créé avec succès.\n\nMot de passe temporaire: ${collecteurData.password}\n\nLe collecteur devra changer son mot de passe lors de sa première connexion.`;

        Alert.alert(
          "Succès",
          message,
          [{ 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        Alert.alert(
          "Erreur",
          result.error || "Une erreur est survenue lors de la sauvegarde"
        );
      }
    } catch (error) {
      console.error('Erreur onSubmit:', error);
      Alert.alert(
        "Erreur",
        "Une erreur inattendue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleResetPassword = async () => {
    if (!isEditMode || !collecteurToEdit) return;
    
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir réinitialiser le mot de passe de ce collecteur?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setResetPasswordLoading(true);
            try {
              const temporaryPassword = generateTemporaryPassword();
              const result = await superAdminService.resetCollecteurPassword(
                collecteurToEdit.id,
                { newPassword: temporaryPassword }
              );
              
              if (result.success) {
                setNewPassword(temporaryPassword);
                setManualPassword(temporaryPassword);
                Alert.alert(
                  "Succès",
                  `Le mot de passe a été réinitialisé avec succès.\n\nNouveau mot de passe temporaire: ${temporaryPassword}\n\nLe collecteur devra changer son mot de passe lors de sa prochaine connexion.`,
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert("Erreur", result.error || "Erreur lors de la réinitialisation");
              }
            } catch (error) {
              console.error('Erreur reset password:', error);
              Alert.alert("Erreur", "Une erreur inattendue est survenue");
            } finally {
              setResetPasswordLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleManualPasswordSave = async () => {
    if (!isEditMode || !collecteurToEdit || !manualPassword.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un mot de passe valide");
      return;
    }

    if (manualPassword.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir modifier le mot de passe de ce collecteur?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setResetPasswordLoading(true);
            try {
              const result = await superAdminService.resetCollecteurPassword(
                collecteurToEdit.id,
                { newPassword: manualPassword }
              );
              
              if (result.success) {
                setNewPassword(manualPassword);
                setShowPasswordField(false);
                Alert.alert(
                  "Succès",
                  "Le mot de passe a été modifié avec succès.",
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert("Erreur", result.error || "Erreur lors de la modification");
              }
            } catch (error) {
              console.error('Erreur manual password save:', error);
              Alert.alert("Erreur", "Une erreur inattendue est survenue");
            } finally {
              setResetPasswordLoading(false);
            }
          }
        }
      ]
    );
  };

  const getSelectedAgenceName = () => {
    const agence = agences.find(a => a.id && a.id.toString() === selectedAgenceId?.toString());
    return agence ? agence.nomAgence : 'Aucune agence sélectionnée';
  };

  if (loadingAgences) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={isEditMode ? "Modifier collecteur" : "Créer collecteur"}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier collecteur" : "Créer collecteur"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>👤 Informations Personnelles</Text>
            
            <Controller
              control={control}
              name="nom"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom *"
                  placeholder="Nom de famille"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nom?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="prenom"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prénom *"
                  placeholder="Prénom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.prenom?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="numeroCni"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Numéro CNI *"
                  placeholder="Ex: 123456789"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  onBlur={onBlur}
                  error={errors.numeroCni?.message}
                  style={styles.input}
                  maxLength={20}
                />
              )}
            />
            
            <Text style={styles.sectionTitle}>📞 Contact</Text>
            
            <Controller
              control={control}
              name="adresseMail"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email *"
                  placeholder="exemple@email.com"
                  value={value}
                  onChangeText={(text) => onChange(text.toLowerCase())}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.adresseMail?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="telephone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Téléphone *"
                  placeholder="+237 6XX XX XX XX"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  error={errors.telephone?.message}
                  style={styles.input}
                />
              )}
            />

            <Text style={styles.sectionTitle}>🏢 Assignation</Text>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Agence d'assignation *</Text>
              <Controller
                control={control}
                name="agenceId"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={value}
                      onValueChange={(itemValue) => {
                        onChange(itemValue);
                        setValue('adminId', ''); // Reset admin selection
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label="Sélectionner une agence" value="" />
                      {agences.filter(agence => agence.id).map(agence => (
                        <Picker.Item
                          key={agence.id}
                          label={`${agence.nomAgence} (${agence.codeAgence || agence.ville})`}
                          value={agence.id.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              />
              {errors.agenceId && (
                <Text style={styles.errorText}>{errors.agenceId.message}</Text>
              )}
            </View>

            {selectedAgenceId && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Admin responsable *</Text>
                <Controller
                  control={control}
                  name="adminId"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={value}
                        onValueChange={onChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Sélectionner un admin responsable" value="" />
                        {admins.filter(admin => admin.id).map(admin => (
                          <Picker.Item
                            key={admin.id}
                            label={`${admin.nom} ${admin.prenom}`}
                            value={admin.id.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                />
                {errors.adminId && (
                  <Text style={styles.errorText}>{errors.adminId.message}</Text>
                )}
              </View>
            )}

            <Text style={styles.sectionTitle}>💰 Paramètres Financiers</Text>

            <Controller
              control={control}
              name="montantMaxRetrait"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Montant maximum de retrait (FCFA) *"
                  placeholder="50000"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  error={errors.montantMaxRetrait?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="ancienneteEnMois"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Ancienneté (en mois) *"
                  placeholder="0"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  error={errors.ancienneteEnMois?.message}
                  style={styles.input}
                />
              )}
            />

            <Text style={styles.sectionTitle}>⚙️ Configuration</Text>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Collecteur actif</Text>
              <Controller
                control={control}
                name="active"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                    thumbColor={value ? theme.colors.primary : theme.colors.gray}
                  />
                )}
              />
            </View>

            {isEditMode && (
              <>
                <Text style={styles.sectionTitle}>Gestion des Identifiants</Text>
                
                <Card style={styles.credentialsCard}>
                  <View style={styles.credentialRow}>
                    <View style={styles.credentialInfo}>
                      <Text style={styles.credentialLabel}>Email de connexion</Text>
                      <Text style={styles.credentialValue}>
                        {watch('adresseMail') || collecteurToEdit?.adresseMail || 'N/A'}
                      </Text>
                      <Text style={styles.credentialNote}>
                        L'email peut être modifié dans la section Contact ci-dessus
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.credentialDivider} />
                  
                  <View style={styles.credentialRow}>
                    <View style={styles.credentialInfo}>
                      <Text style={styles.credentialLabel}>Mot de passe</Text>
                      <Text style={styles.credentialValue}>
                        {newPassword ? `Nouveau: ${newPassword}` : '••••••••••••• (crypté)'}
                      </Text>
                      <Text style={styles.credentialNote}>
                        Le mot de passe actuel est crypté. Vous pouvez le réinitialiser manuellement ou automatiquement.
                      </Text>
                    </View>
                  </View>

                  {!showPasswordField ? (
                    <View style={styles.passwordButtonsContainer}>
                      <TouchableOpacity
                        style={styles.manualPasswordButton}
                        onPress={() => {
                          setShowPasswordField(true);
                          setManualPassword(newPassword || '');
                        }}
                      >
                        <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.manualPasswordText}>Définir manuellement</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.resetPasswordButton}
                        onPress={handleResetPassword}
                        disabled={resetPasswordLoading}
                      >
                        <Ionicons 
                          name="refresh" 
                          size={16} 
                          color={theme.colors.white} 
                          style={resetPasswordLoading && { opacity: 0.6 }}
                        />
                        <Text style={[styles.resetPasswordText, resetPasswordLoading && { opacity: 0.6 }]}>
                          {resetPasswordLoading ? 'Génération...' : 'Générer automatiquement'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.credentialDivider} />
                      <View style={styles.passwordEditContainer}>
                        <Text style={styles.credentialLabel}>Nouveau mot de passe</Text>
                        <Input
                          value={manualPassword}
                          onChangeText={setManualPassword}
                          placeholder="Saisissez le nouveau mot de passe (min. 8 caractères)"
                          secureTextEntry
                          style={styles.passwordInput}
                        />
                        <View style={styles.passwordEditButtons}>
                          <TouchableOpacity
                            style={styles.cancelPasswordButton}
                            onPress={() => {
                              setShowPasswordField(false);
                              setManualPassword('');
                            }}
                          >
                            <Text style={styles.cancelPasswordText}>Annuler</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.savePasswordButton}
                            onPress={handleManualPasswordSave}
                            disabled={resetPasswordLoading}
                          >
                            <Ionicons 
                              name="checkmark" 
                              size={16} 
                              color={theme.colors.white} 
                              style={resetPasswordLoading && { opacity: 0.6 }}
                            />
                            <Text style={[styles.savePasswordText, resetPasswordLoading && { opacity: 0.6 }]}>
                              {resetPasswordLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </Card>
              </>
            )}

            <Card style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.infoTitle}>Informations importantes</Text>
              </View>
              <Text style={styles.infoText}>
                • Agence sélectionnée: {getSelectedAgenceName()}
                {'\n'}• Le collecteur pourra se connecter à l'application mobile
                {'\n'}• Un mot de passe temporaire sera généré automatiquement
                {'\n'}• Le collecteur devra changer son mot de passe lors de sa première connexion
                {'\n'}• Tous les comptes financiers seront créés automatiquement
              </Text>
            </Card>
            
            <Button
              title={isEditMode ? "Mettre à jour le collecteur" : "Créer le collecteur"}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitButton}
            />
            
            <Button
              title="Annuler"
              onPress={() => navigation.goBack()}
              variant="outlined"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  form: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  infoCard: {
    backgroundColor: theme.colors.infoLight,
    marginTop: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.info,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.info,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 32,
  },
  credentialsCard: {
    backgroundColor: theme.colors.white,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  credentialInfo: {
    flex: 1,
    marginRight: 16,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  credentialNote: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  credentialDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  resetPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
    justifyContent: 'center',
  },
  resetPasswordText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  newPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    padding: 12,
    borderRadius: 6,
  },
  newPasswordText: {
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 8,
    flex: 1,
  },
  newPasswordValue: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
  },
  passwordButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  manualPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  manualPasswordText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  passwordEditContainer: {
    paddingTop: 16,
  },
  passwordInput: {
    marginTop: 8,
    marginBottom: 16,
  },
  passwordEditButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelPasswordButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelPasswordText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  savePasswordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
  },
  savePasswordText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default CollecteurCreationScreen;