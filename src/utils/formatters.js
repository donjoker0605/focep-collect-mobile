// src/utils/formatters.js - CRÉATION DU FICHIER MANQUANT
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '0';
  }
  
  // Formatage avec séparateurs de milliers
  return numericAmount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const formatDate = (date, format = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('fr-FR');
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '';
  }
};

export const formatTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erreur formatage heure:', error);
    return '';
  }
};