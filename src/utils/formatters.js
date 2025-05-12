import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate un montant en devise FCFA
 * @param {number} amount - Le montant à formater
 * @param {boolean} withSymbol - Inclure le symbole de devise
 * @param {number} decimals - Nombre de décimales à afficher
 * @returns {string} - Le montant formaté
 */
export const formatCurrency = (amount, withSymbol = true, decimals = 2) => {
  if (amount === null || amount === undefined) {
    return '-';
  }
  
  try {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: withSymbol ? 'currency' : 'decimal',
      currency: 'XAF',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback au cas où le formatage échoue
    const formattedNumber = Number(amount).toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return withSymbol ? `${formattedNumber} FCFA` : formattedNumber;
  }
};

/**
 * Formate une date selon le format spécifié
 * @param {Date|string} date - La date à formater (objet Date ou chaîne ISO)
 * @param {string} formatStr - Le format de date (par défaut: 'dd/MM/yyyy')
 * @returns {string} - La date formatée
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) {
    return '-';
  }
  
  try {
    // Si la date est une chaîne, la convertir en objet Date
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return String(date);
  }
};

/**
 * Formate une date et heure selon le format spécifié
 * @param {Date|string} date - La date à formater (objet Date ou chaîne ISO)
 * @param {string} formatStr - Le format de date (par défaut: 'dd/MM/yyyy HH:mm')
 * @returns {string} - La date et heure formatées
 */
export const formatDateTime = (date, formatStr = 'dd/MM/yyyy HH:mm') => {
  return formatDate(date, formatStr);
};

/**
 * Formate un numéro de téléphone
 * @param {string} phoneNumber - Le numéro de téléphone à formater
 * @returns {string} - Le numéro de téléphone formaté
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return '-';
  }
  
  // Nettoyer le numéro pour ne garder que les chiffres
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  
  // Format camerounais : +237 6XX XX XX XX
  if (cleaned.length === 9) {
    return `+237 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('237')) {
    return `+237 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10, 12)}`;
  }
  
  // Retourner le numéro tel quel s'il ne correspond pas au format attendu
  return phoneNumber;
};

/**
 * Formate un pourcentage
 * @param {number} value - La valeur à formater en pourcentage
 * @param {number} decimals - Nombre de décimales à afficher
 * @returns {string} - Le pourcentage formaté
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Convertir en pourcentage si la valeur est entre 0 et 1
  const percentage = value > 0 && value < 1 ? value * 100 : value;
  
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Formate un texte en capitalisant la première lettre de chaque mot
 * @param {string} text - Le texte à formater
 * @returns {string} - Le texte formaté
 */
export const capitalizeWords = (text) => {
  if (!text) {
    return '';
  }
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {number} number - Le nombre à formater
 * @param {number} decimals - Nombre de décimales à afficher
 * @returns {string} - Le nombre formaté
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  } catch (error) {
    // Fallback au cas où le formatage échoue
    return Number(number).toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
};