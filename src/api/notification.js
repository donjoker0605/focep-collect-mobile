// src/api/notification.js
import api from './axiosConfig';

/**
 * Récupérer les notifications de l'utilisateur
 * @returns {Promise<Array>} Liste des notifications
 */
export const getNotifications = async () => {
  try {
    const response = await api.get('/api/notifications');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

/**
 * Marquer une notification comme lue
 * @param {string} notificationId Identifiant de la notification
 * @returns {Promise<Object>} Notification mise à jour
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    throw error;
  }
};

/**
 * Marquer toutes les notifications comme lues
 * @returns {Promise<Object>} Statut de l'opération
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    throw error;
  }
};

/**
 * Supprimer une notification
 * @param {string} notificationId Identifiant de la notification
 * @returns {Promise<Object>} Statut de l'opération
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

/**
 * Supprimer toutes les notifications
 * @returns {Promise<Object>} Statut de l'opération
 */
export const deleteAllNotifications = async () => {
  try {
    const response = await api.delete('/api/notifications');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les notifications:', error);
    throw error;
  }
};

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
};