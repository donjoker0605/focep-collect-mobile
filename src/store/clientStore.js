import { create } from 'zustand';
import ClientService from '../services/clientService';

export const useClientStore = create((set, get) => ({
  // State
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,

  // Actions
  fetchClients: async (collecteurId) => {
    set({ isLoading: true, error: null });
    
    try {
      const clients = await ClientService.getClientsByCollecteur(collecteurId);
      set({
        clients,
        isLoading: false,
      });
      return { success: true, data: clients };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  createClient: async (clientData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newClient = await ClientService.createClient(clientData);
      set((state) => ({
        clients: [...state.clients, newClient],
        isLoading: false,
      }));
      return { success: true, data: newClient };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateClient: async (clientId, clientData) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedClient = await ClientService.updateClient(clientId, clientData);
      set((state) => ({
        clients: state.clients.map(client => 
          client.id === clientId ? updatedClient : client
        ),
        selectedClient: state.selectedClient?.id === clientId ? updatedClient : state.selectedClient,
        isLoading: false,
      }));
      return { success: true, data: updatedClient };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteClient: async (clientId) => {
    set({ isLoading: true, error: null });
    
    try {
      await ClientService.deleteClient(clientId);
      set((state) => ({
        clients: state.clients.filter(client => client.id !== clientId),
        selectedClient: state.selectedClient?.id === clientId ? null : state.selectedClient,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  selectClient: (client) => {
    set({ selectedClient: client });
  },

  getClientById: async (clientId) => {
    try {
      const client = await ClientService.getClientById(clientId);
      return { success: true, data: client };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),
}));