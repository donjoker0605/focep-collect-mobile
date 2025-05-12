// src/store/appStore.js
import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Paramètres de l'application
  isDarkMode: false,
  setDarkMode: (value) => set({ isDarkMode: value }),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => set(state => ({
    notifications: [notification, ...state.notifications]
  })),
  markNotificationAsRead: (notificationId) => set(state => ({
    notifications: state.notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  // États de l'application
  isOfflineMode: false,
  pendingTransactions: [],
  
  // Méthodes pour le mode hors ligne
  setOfflineMode: (value) => set({ isOfflineMode: value }),
  addPendingTransaction: (transaction) => set(state => ({
    pendingTransactions: [...state.pendingTransactions, transaction]
  })),
  clearPendingTransactions: () => set({ pendingTransactions: [] }),
  
  // Synchronisation
  syncPendingTransactions: async () => {
    const { pendingTransactions } = get();
    
    if (pendingTransactions.length === 0) return;
    
    try {
      // Logique pour synchroniser les transactions en attente
      // Dans une implémentation réelle, vous appelleriez le service API pour chaque transaction
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Si la synchronisation réussit, effacer les transactions en attente
      set({ pendingTransactions: [] });
      
      // Ajouter une notification de succès
      get().addNotification({
        id: Date.now(),
        type: 'success',
        message: `${pendingTransactions.length} transaction(s) synchronisée(s) avec succès.`,
        read: false,
        timestamp: new Date(),
      });
    } catch (error) {
      // En cas d'erreur, ajouter une notification d'erreur
      get().addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Erreur lors de la synchronisation des transactions.',
        read: false,
        timestamp: new Date(),
      });
    }
  },
}));

export default useAppStore;