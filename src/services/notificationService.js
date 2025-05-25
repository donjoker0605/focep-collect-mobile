// src/services/notificationService.js
import BaseApiService from './base/BaseApiService';

class NotificationService extends BaseApiService {
  constructor() {
    super();
  }

  async getNotifications(page = 0, size = 10) {
    try {
      const response = await this.axios.get('/notifications', { 
        params: { page, size } 
      });
      
      return this.formatResponse(response, 'Notifications récupérées');
    } catch (error) {
      console.error('Erreur getNotifications:', error);
      
      // Si l'endpoint n'existe pas côté backend, retourner des données vides
      if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint notifications non implémenté côté backend');
        return {
          data: [],
          totalElements: 0,
          unreadCount: 0,
          success: true,
          warning: 'Endpoint notifications non disponible'
        };
      }
      
      this.handleError(error, 'Erreur lors de la récupération des notifications');
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await this.axios.patch(`/notifications/${notificationId}/read`);
      return this.formatResponse(response, 'Notification marquée comme lue');
    } catch (error) {
      this.handleError(error, 'Erreur lors du marquage comme lu');
    }
  }
}

export default new NotificationService();