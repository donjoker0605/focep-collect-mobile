import { format, parse, isValid, isAfter, isBefore, parseISO, differenceInDays, addDays, addMonths, addYears, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Convertit une chaîne de date au format JJ/MM/AAAA en objet Date
 * @param {string} dateString - La date au format JJ/MM/AAAA
 * @returns {Date|null} - L'objet Date ou null si la date est invalide
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Erreur lors du parsing de la date:', error);
    return null;
  }
};

/**
 * Convertit une chaîne de date au format ISO en objet Date
 * @param {string} isoString - La date au format ISO
 * @returns {Date|null} - L'objet Date ou null si la date est invalide
 */
export const parseISODate = (isoString) => {
  if (!isoString) return null;
  
  try {
    const parsedDate = parseISO(isoString);
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Erreur lors du parsing de la date ISO:', error);
    return null;
  }
};

/**
 * Formate une date en chaîne selon le format spécifié
 * @param {Date|string} date - La date à formater
 * @param {string} formatStr - Le format de sortie (défaut: 'dd/MM/yyyy')
 * @returns {string} - La date formatée
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    
    if (!dateObj || !isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
};

/**
 * Formate l'heure d'une date
 * @param {Date|string} date - La date à formater
 * @param {string} formatStr - Le format de sortie (défaut: 'HH:mm')
 * @returns {string} - L'heure formatée
 */
export const formatTime = (date, formatStr = 'HH:mm') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    
    if (!dateObj || !isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error('Erreur lors du formatage de l\'heure:', error);
    return '';
  }
};

/**
 * Vérifie si une date est postérieure à une autre
 * @param {Date|string} date - La date à vérifier
 * @param {Date|string} comparedTo - La date de comparaison
 * @returns {boolean} - True si date est postérieure à comparedTo
 */
export const isDateAfter = (date, comparedTo) => {
  if (!date || !comparedTo) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    const comparedToObj = typeof comparedTo === 'string' ? parseISODate(comparedTo) : comparedTo;
    
    if (!dateObj || !comparedToObj || !isValid(dateObj) || !isValid(comparedToObj)) {
      return false;
    }
    
    return isAfter(dateObj, comparedToObj);
  } catch (error) {
    console.error('Erreur lors de la comparaison des dates:', error);
    return false;
  }
};

/**
 * Vérifie si une date est antérieure à une autre
 * @param {Date|string} date - La date à vérifier
 * @param {Date|string} comparedTo - La date de comparaison
 * @returns {boolean} - True si date est antérieure à comparedTo
 */
export const isDateBefore = (date, comparedTo) => {
  if (!date || !comparedTo) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    const comparedToObj = typeof comparedTo === 'string' ? parseISODate(comparedTo) : comparedTo;
    
    if (!dateObj || !comparedToObj || !isValid(dateObj) || !isValid(comparedToObj)) {
      return false;
    }
    
    return isBefore(dateObj, comparedToObj);
  } catch (error) {
    console.error('Erreur lors de la comparaison des dates:', error);
    return false;
  }
};

/**
 * Calcule la différence en jours entre deux dates
 * @param {Date|string} dateStart - La date de début
 * @param {Date|string} dateEnd - La date de fin
 * @returns {number} - Le nombre de jours de différence
 */
export const getDaysDifference = (dateStart, dateEnd) => {
  if (!dateStart || !dateEnd) return 0;
  
  try {
    const startObj = typeof dateStart === 'string' ? parseISODate(dateStart) : dateStart;
    const endObj = typeof dateEnd === 'string' ? parseISODate(dateEnd) : dateEnd;
    
    if (!startObj || !endObj || !isValid(startObj) || !isValid(endObj)) {
      return 0;
    }
    
    return differenceInDays(endObj, startObj);
  } catch (error) {
    console.error('Erreur lors du calcul de la différence de jours:', error);
    return 0;
  }
};

/**
 * Ajoute un nombre spécifié de jours à une date
 * @param {Date|string} date - La date de base
 * @param {number} days - Le nombre de jours à ajouter
 * @returns {Date} - La nouvelle date
 */
export const addDaysToDate = (date, days) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    
    if (!dateObj || !isValid(dateObj)) {
      return null;
    }
    
    return addDays(dateObj, days);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de jours à la date:', error);
    return null;
  }
};

/**
 * Ajoute un nombre spécifié de mois à une date
 * @param {Date|string} date - La date de base
 * @param {number} months - Le nombre de mois à ajouter
 * @returns {Date} - La nouvelle date
 */
export const addMonthsToDate = (date, months) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    
    if (!dateObj || !isValid(dateObj)) {
      return null;
    }
    
    return addMonths(dateObj, months);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de mois à la date:', error);
    return null;
  }
};

/**
 * Obtient le premier jour du mois pour une date donnée
 * @param {Date|string} date - La date
 * @returns {Date} - Le premier jour du mois
 */
export const getFirstDayOfMonth = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    
    if (!dateObj || !isValid(dateObj)) {
      return null;
    }
    
    return startOfMonth(dateObj);
  } catch (error) {
    console.error('Erreur lors de la récupération du premier jour du mois:', error);
    return null;
  }
};

/**
 * Obtient le dernier jour du mois pour une date donnée
 * @param {Date|string} date - La date
 * @returns {Date} - Le dernier jour du mois
 */
export const getLastDayOfMonth = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    
    if (!dateObj || !isValid(dateObj)) {
      return null;
    }
    
    return endOfMonth(dateObj);
  } catch (error) {
    console.error('Erreur lors de la récupération du dernier jour du mois:', error);
    return null;
  }
};

/**
 * Vérifie si une date est dans un intervalle donné
 * @param {Date|string} date - La date à vérifier
 * @param {Date|string} startDate - La date de début de l'intervalle
 * @param {Date|string} endDate - La date de fin de l'intervalle
 * @returns {boolean} - True si la date est dans l'intervalle
 */
export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate || !endDate) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISODate(date) : date;
    const startObj = typeof startDate === 'string' ? parseISODate(startDate) : startDate;
    const endObj = typeof endDate === 'string' ? parseISODate(endDate) : endDate;
    
    if (!dateObj || !startObj || !endObj || !isValid(dateObj) || !isValid(startObj) || !isValid(endObj)) {
      return false;
    }
    
    return isWithinInterval(dateObj, { start: startObj, end: endObj });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'intervalle de date:', error);
    return false;
  }
};

/**
 * Obtient les dates des 31 jours d'un mois pour un mois et une année spécifiques
 * @param {number} year - L'année
 * @param {number} month - Le mois (1-12)
 * @returns {Array<Date>} - Tableau de dates pour le mois
 */
export const getMonthDays = (year, month) => {
  try {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month - 1, i));
    }
    
    // Compléter à 31 jours pour avoir un tableau uniforme
    for (let i = daysInMonth + 1; i <= 31; i++) {
      days.push(null);
    }
    
    return days;
  } catch (error) {
    console.error('Erreur lors de la génération des jours du mois:', error);
    return Array(31).fill(null);
  }
};

/**
 * Obtient le nombre de jours dans un mois
 * @param {number} year - L'année
 * @param {number} month - Le mois (1-12)
 * @returns {number} - Nombre de jours dans le mois
 */
export const getDaysInMonth = (year, month) => {
  try {
    return new Date(year, month, 0).getDate();
  } catch (error) {
    console.error('Erreur lors du calcul du nombre de jours dans le mois:', error);
    return 31; // Valeur par défaut
  }
};