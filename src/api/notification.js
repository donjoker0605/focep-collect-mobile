// src/api/notification.js - CORRIGÉE POUR 404
import apiService from '../services/api';

export const getNotifications = async (page = 0, size = 10) => {
  try {
    // ✅ CORRECTION CRITIQUE : Ne pas répéter /api/
    const response = await apiService.get('/notifications', { page, size });
    
    return {
      data: response.content || response.data || [],
      totalElements: response.totalElements || 0,
      unreadCount: response.unreadCount || 0,
      success: true
    };
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    
    // Si l'endpoint n'existe pas côté backend, retourner des données vides
    if (error.status === 404) {
      console.warn('⚠️ Endpoint notifications non implémenté côté backend');
      return {
        data: [],
        totalElements: 0,
        unreadCount: 0,
        success: true,
        warning: 'Endpoint notifications non disponible'
      };
    }
    
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await apiService.patch(`/notifications/${notificationId}/read`);
    return {
      data: response.data || response,
      success: true
    };
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    return { success: false, error: error.message };
  }
};

const notificationAPI = {
  getNotifications,
  markAsRead
};

export default notificationAPI;