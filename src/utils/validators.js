import * as yup from 'yup';

// Validation de format pour un numéro de téléphone camerounais
const phoneRegExp = /^(\+237|237)?[ ]?[6-9][0-9]{8}$/;

// Validation de format pour un numéro CNI
const cniRegExp = /^[A-Za-z0-9]{6,12}$/;

// Schémas de validation réutilisables
export const validationSchemas = {
  // Schéma de connexion
  login: yup.object().shape({
    email: yup
      .string()
      .email('Veuillez entrer un email valide')
      .required('L\'email est requis'),
    password: yup
      .string()
      .required('Le mot de passe est requis'),
  }),

  // Schéma d'inscription
  register: yup.object().shape({
    fullName: yup
      .string()
      .required('Le nom complet est requis'),
    email: yup
      .string()
      .email('Veuillez entrer un email valide')
      .required('L\'email est requis'),
    phoneNumber: yup
      .string()
      .matches(phoneRegExp, 'Numéro de téléphone invalide')
      .required('Le numéro de téléphone est requis'),
    dateOfBirth: yup
      .string()
      .matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Format de date invalide (JJ/MM/AAAA)')
      .required('La date de naissance est requise'),
    password: yup
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial'
      )
      .required('Le mot de passe est requis'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
      .required('La confirmation du mot de passe est requise'),
  }),

  // Schéma de récupération de mot de passe
  forgotPassword: yup.object().shape({
    email: yup
      .string()
      .email('Veuillez entrer un email valide')
      .required('L\'email est requis'),
  }),

  // Schéma de code de sécurité
  securityPin: yup.object().shape({
    code: yup
      .string()
      .length(6, 'Le code de sécurité doit contenir 6 chiffres')
      .matches(/^\d+$/, 'Le code de sécurité ne doit contenir que des chiffres')
      .required('Le code de sécurité est requis'),
  }),

  // Schéma de nouveau mot de passe
  newPassword: yup.object().shape({
    password: yup
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial'
      )
      .required('Le mot de passe est requis'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
      .required('La confirmation du mot de passe est requise'),
  }),

  // Schéma de client
  client: yup.object().shape({
    nom: yup
      .string()
      .required('Le nom est requis'),
    prenom: yup
      .string()
      .required('Le prénom est requis'),
    numeroCni: yup
      .string()
      .matches(cniRegExp, 'Numéro CNI invalide')
      .required('Le numéro CNI est requis'),
    telephone: yup
      .string()
      .matches(phoneRegExp, 'Numéro de téléphone invalide')
      .required('Le numéro de téléphone est requis'),
    ville: yup
      .string()
      .required('La ville est requise'),
    quartier: yup
      .string()
      .required('Le quartier est requis'),
  }),

  // Schéma de collecteur
  collecteur: yup.object().shape({
    nom: yup
      .string()
      .required('Le nom est requis'),
    prenom: yup
      .string()
      .required('Le prénom est requis'),
    adresseMail: yup
      .string()
      .email('Veuillez entrer un email valide')
      .required('L\'email est requis'),
    numeroCni: yup
      .string()
      .matches(cniRegExp, 'Numéro CNI invalide')
      .required('Le numéro CNI est requis'),
    telephone: yup
      .string()
      .matches(phoneRegExp, 'Numéro de téléphone invalide')
      .required('Le numéro de téléphone est requis'),
    montantMaxRetrait: yup
      .number()
      .typeError('Le montant maximal doit être un nombre')
      .min(1000, 'Le montant minimal autorisé est de 1 000 FCFA')
      .max(500000, 'Le montant maximal autorisé est de 500 000 FCFA')
      .required('Le montant maximal de retrait est requis'),
    agenceId: yup
      .number()
      .positive('Veuillez sélectionner une agence')
      .required('L\'agence est requise'),
  }),

  // Schéma de caution morale
  caution: yup.object().shape({
    nom: yup
      .string()
      .required('Le nom est requis'),
    prenom: yup
      .string()
      .required('Le prénom est requis'),
    numeroCni: yup
      .string()
      .matches(cniRegExp, 'Numéro CNI invalide')
      .required('Le numéro CNI est requis'),
    telephone: yup
      .string()
      .matches(phoneRegExp, 'Numéro de téléphone invalide')
      .required('Le numéro de téléphone est requis'),
    adresse: yup
      .string()
      .required('L\'adresse est requise'),
    relation: yup
      .string()
      .required('La relation avec le collecteur est requise'),
  }),

  // Schéma d'épargne
  epargne: yup.object().shape({
    clientId: yup
      .number()
      .positive('Veuillez sélectionner un client')
      .required('Le client est requis'),
    montant: yup
      .number()
      .typeError('Le montant doit être un nombre')
      .positive('Le montant doit être positif')
      .required('Le montant est requis'),
    journalId: yup
      .number()
      .nullable(),
  }),

  // Schéma de retrait
  retrait: yup.object().shape({
    clientId: yup
      .number()
      .positive('Veuillez sélectionner un client')
      .required('Le client est requis'),
    montant: yup
      .number()
      .typeError('Le montant doit être un nombre')
      .positive('Le montant doit être positif')
      .required('Le montant est requis'),
    journalId: yup
      .number()
      .nullable(),
  }),

  // Schéma de paramètres de commission
  commissionParams: yup.object().shape({
    type: yup
      .string()
      .oneOf(['FIXED', 'PERCENTAGE', 'TIER'], 'Type de commission invalide')
      .required('Le type de commission est requis'),
    valeur: yup
      .number()
      .when('type', {
        is: (val) => val === 'FIXED' || val === 'PERCENTAGE',
        then: (schema) => schema
          .typeError('La valeur doit être un nombre')
          .min(0, 'La valeur ne peut pas être négative')
          .required('La valeur est requise'),
        otherwise: (schema) => schema.nullable(),
      }),
    codeProduit: yup
      .string()
      .when('type', {
        is: 'FIXED',
        then: (schema) => schema.required('Le code produit est requis'),
        otherwise: (schema) => schema.nullable(),
      }),
    tiers: yup
      .array()
      .when('type', {
        is: 'TIER',
        then: (schema) => schema
          .of(
            yup.object().shape({
              montantMin: yup
                .number()
                .typeError('Le montant minimum doit être un nombre')
                .min(0, 'Le montant minimum ne peut pas être négatif')
                .required('Le montant minimum est requis'),
              montantMax: yup
                .number()
                .typeError('Le montant maximum doit être un nombre')
                .min(yup.ref('montantMin'), 'Le montant maximum doit être supérieur au montant minimum')
                .required('Le montant maximum est requis'),
              taux: yup
                .number()
                .typeError('Le taux doit être un nombre')
                .min(0, 'Le taux ne peut pas être négatif')
                .max(100, 'Le taux ne peut pas dépasser 100%')
                .required('Le taux est requis'),
            })
          )
          .min(1, 'Au moins un palier est requis'),
        otherwise: (schema) => schema.nullable(),
      }),
  }),

  // Schéma de transfert de comptes
  transfertComptes: yup.object().shape({
    sourceCollecteurId: yup
      .number()
      .positive('Veuillez sélectionner un collecteur source')
      .required('Le collecteur source est requis'),
    targetCollecteurId: yup
      .number()
      .positive('Veuillez sélectionner un collecteur cible')
      .notOneOf([yup.ref('sourceCollecteurId')], 'Le collecteur cible doit être différent du collecteur source')
      .required('Le collecteur cible est requis'),
    clientIds: yup
      .array()
      .of(yup.number().positive())
      .min(1, 'Veuillez sélectionner au moins un client')
      .required('Au moins un client doit être sélectionné'),
  }),

  // Schéma de mise à jour du montant maximal de retrait
  updateMontantMaxRetrait: yup.object().shape({
    montant: yup
      .number()
      .typeError('Le montant maximal doit être un nombre')
      .min(1000, 'Le montant minimal autorisé est de 1 000 FCFA')
      .max(500000, 'Le montant maximal autorisé est de 500 000 FCFA')
      .required('Le montant maximal de retrait est requis'),
    justification: yup
      .string()
      .min(10, 'La justification doit contenir au moins 10 caractères')
      .required('La justification est requise'),
  }),

  // Schéma d'arrêté de compte
  arreteCompte: yup.object().shape({
    compteId: yup
      .number()
      .positive('Veuillez sélectionner un compte')
      .required('Le compte est requis'),
    soldePhysique: yup
      .number()
      .typeError('Le solde physique doit être un nombre')
      .min(0, 'Le solde physique ne peut pas être négatif')
      .required('Le solde physique est requis'),
  }),
};

/**
 * Valide un montant de retrait par rapport au solde disponible et au montant maximal autorisé
 * @param {number} montant - Le montant à valider
 * @param {number} soldeDispo - Le solde disponible
 * @param {number} montantMax - Le montant maximal autorisé
 * @returns {Object} - Le résultat de la validation
 */
export const validateRetraitAmount = (montant, soldeDispo, montantMax) => {
  if (isNaN(montant) || montant <= 0) {
    return {
      isValid: false,
      message: 'Le montant doit être un nombre positif'
    };
  }

  if (montant > soldeDispo) {
    return {
      isValid: false,
      message: `Solde insuffisant. Solde disponible: ${soldeDispo}`
    };
  }

  if (montant > montantMax) {
    return {
      isValid: false,
      message: `Le montant dépasse la limite autorisée de ${montantMax}`
    };
  }

  return {
    isValid: true,
    message: 'Montant valide'
  };
};

/**
 * Vérifie si un numéro de téléphone est au format camerounais valide
 * @param {string} phoneNumber - Le numéro de téléphone à valider
 * @returns {boolean} - True si le numéro est valide, false sinon
 */
export const isValidPhoneNumber = (phoneNumber) => {
  return phoneRegExp.test(phoneNumber);
};

/**
 * Vérifie si un numéro CNI est au format valide
 * @param {string} cni - Le numéro CNI à valider
 * @returns {boolean} - True si le numéro est valide, false sinon
 */
export const isValidCNI = (cni) => {
  return cniRegExp.test(cni);
};

/**
 * Vérifie si une adresse email est valide
 * @param {string} email - L'adresse email à valider
 * @returns {boolean} - True si l'email est valide, false sinon
 */
export const isValidEmail = (email) => {
  return yup.string().email().isValidSync(email);
};