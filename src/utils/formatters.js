// src/utils/formatters.js - CORRECTION COMPLÈTE
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

// ✅ FONCTION MANQUANTE QUI CAUSE L'ERREUR
export const formatTimeAgo = (date) => {
  if (!date) return 'Jamais';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Date invalide';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    // Moins d'une minute
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    }
    
    // Moins d'une heure
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes}min`;
    }
    
    // Moins d'une journée
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    }
    
    // Moins d'une semaine
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `Il y a ${diffInDays}j`;
    }
    
    // Plus d'une semaine - afficher la date
    return formatDate(dateObj);
    
  } catch (error) {
    console.error('Erreur formatage timeAgo:', error);
    return 'Date invalide';
  }
};

// ✅ FONCTIONS BONUS POUR LES NOTIFICATIONS
export const formatNotificationTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInHours = Math.floor((now - dateObj) / (1000 * 60 * 60));
    
    // Si c'est aujourd'hui, afficher l'heure
    if (diffInHours < 24) {
      return formatTime(dateObj);
    }
    
    // Sinon afficher la date
    return formatDate(dateObj);
    
  } catch (error) {
    console.error('Erreur formatage notification time:', error);
    return '';
  }
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now - dateObj;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 10) return 'À l\'instant';
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 30) return `${diffInDays}j`;
    
    return formatDate(dateObj);
    
  } catch (error) {
    console.error('Erreur formatage relative time:', error);
    return '';
  }
};