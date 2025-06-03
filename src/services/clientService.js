// src/services/clientService.js - VERSION FINALE COMPLÈTE AVEC NOUVEAUX ENDPOINTS
import BaseApiService from './base/BaseApiService';
import authService from './authService';

class ClientService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async getClients({ collecteurId, page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async getClientsByCollecteur(collecteurId) {
    const result = await this.getClients({ collecteurId, size: 1000 });
    return result.data || [];
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async getClientById(clientId) {
    try {
      console.log('🔍 API: GET /clients/', clientId);
      const response = await this.axios.get(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client récupéré');
    } catch (error) {
      console.error('❌ Erreur récupération client:', error);
      throw this.handleError(error, 'Erreur lors de la récupération du client');
    }
  }

  // ✅ NOUVEAU ENDPOINT PRINCIPAL - DÉTAILS COMPLETS AVEC TRANSACTIONS
  async getClientDetails(clientId) {
    try {
      console.log('🔍 API: GET /clients/{}/with-transactions', clientId);
      const response = await this.axios.get(`/clients/${clientId}/with-transactions`);
      
      if (response.data && response.data.success) {
        const clientDetails = response.data.data;
        
        // ✅ FORMATAGE ET ENRICHISSEMENT DES DONNÉES
        const enrichedClient = {
          ...clientDetails,
          displayName: `${clientDetails.prenom} ${clientDetails.nom}`,
          statusText: clientDetails.valide ? 'Actif' : 'Inactif',
          formattedPhone: this.formatPhoneNumber(clientDetails.telephone),
          fullAddress: `${clientDetails.ville || ''}${clientDetails.quartier ? ', ' + clientDetails.quartier : ''}`.trim(),
          
          // ✅ TRANSACTIONS FORMATÉES
          transactions: (clientDetails.transactions || []).map(transaction => ({
            ...transaction,
            isEpargne: transaction.typeMouvement === 'EPARGNE' || transaction.sens === 'epargne',
            formattedDate: this.formatTransactionDate(transaction.dateOperation),
            displayAmount: this.formatCurrency(transaction.montant)
          })),
          
          // ✅ CALCULS FINANCIERS SÉCURISÉS
          totalEpargne: clientDetails.totalEpargne || 0,
          totalRetraits: clientDetails.totalRetraits || 0,
          soldeTotal: clientDetails.soldeTotal || 0,
          totalTransactions: clientDetails.totalTransactions || (clientDetails.transactions?.length || 0)
        };
        
        console.log('✅ Client avec détails formaté:', enrichedClient);
        return enrichedClient;
      } else {
        throw new Error(response.data?.message || 'Détails du client non trouvés');
      }
    } catch (error) {
      console.error('❌ Erreur récupération détails client:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erreur lors de la récupération des détails du client');
    }
  }

  // ✅ NOUVEAU ENDPOINT - TRANSACTIONS D'UN CLIENT
  async getClientTransactions(clientId, filters = {}) {
    try {
      console.log('📊 API: GET /mouvements/client/{} avec filtres:', clientId, filters);
      
      const params = new URLSearchParams();
      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
      if (filters.dateFin) params.append('dateFin', filters.dateFin);
      if (filters.type) params.append('type', filters.type);
      
      const queryString = params.toString();
      const url = `/mouvements/client/${clientId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.axios.get(url);
      
      if (response.data && response.data.success) {
        const transactions = response.data.data || [];
        
        // ✅ FORMATAGE DES TRANSACTIONS
        return transactions.map(transaction => ({
          ...transaction,
          isEpargne: transaction.typeMouvement === 'EPARGNE' || transaction.sens === 'epargne',
          formattedDate: this.formatTransactionDate(transaction.dateOperation),
          displayAmount: this.formatCurrency(transaction.montant),
          typeLabel: this.getTransactionTypeLabel(transaction)
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur récupération transactions client:', error);
      // Ne pas faire échouer l'écran pour les transactions
      return [];
    }
  }

  // ✅ NOUVEAU ENDPOINT - SOLDE D'UN CLIENT
  async getClientBalance(clientId) {
    try {
      console.log('💰 API: GET /clients/{}/balance', clientId);
      const response = await this.axios.get(`/clients/${clientId}/balance`);
      return this.formatResponse(response, 'Solde client récupéré');
    } catch (error) {
      console.error('❌ Erreur récupération solde client:', error);
      // Retourner un solde par défaut plutôt que de faire échouer
      return {
        success: false,
        data: { solde: 0, devise: 'FCFA' },
        message: 'Impossible de récupérer le solde'
      };
    }
  }

  // ✅ NOUVEAU ENDPOINT - STATISTIQUES D'UN CLIENT
  async getClientStats(clientId) {
    try {
      console.log('📈 API: GET /clients/{}/stats', clientId);
      const response = await this.axios.get(`/clients/${clientId}/stats`);
      return this.formatResponse(response, 'Statistiques client récupérées');
    } catch (error) {
      console.error('❌ Erreur récupération stats client:', error);
      // Retourner des stats par défaut
      return {
        success: false,
        data: {
          totalEpargne: 0,
          totalRetraits: 0,
          soldeActuel: 0,
          nombreTransactions: 0,
          derniereMaj: new Date().toISOString()
        },
        message: 'Statistiques non disponibles'
      };
    }
  }

  // ✅ MÉTHODE EXISTANTE AMÉLIORÉE
  async createClient(clientData) {
    try {
      console.log('📱 API: POST /clients - Données reçues:', clientData);
      
      // ✅ RÉCUPÉRATION SÉCURISÉE DE L'UTILISATEUR CONNECTÉ
      const user = await authService.getCurrentUser();
      console.log('👤 Utilisateur connecté:', user);
      
      if (!user) {
        throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');
      }

      // ✅ ENRICHISSEMENT CORRECT DES DONNÉES
      const enrichedData = {
        nom: clientData.nom,
        prenom: clientData.prenom,
        numeroCni: clientData.numeroCni,
        telephone: clientData.telephone,
        ville: clientData.ville || 'Douala',
        quartier: clientData.quartier || '',
        // IDs obligatoires pour le backend
        collecteurId: clientData.collecteurId || user.id,
        agenceId: clientData.agenceId || user.agenceId,
      };

      console.log('📤 Données enrichies envoyées:', enrichedData);
      
      // Validation côté client avant envoi
      const validation = this.validateClientDataLocally(enrichedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Données invalides',
          validationErrors: validation.errors
        };
      }
      
      const response = await this.axios.post('/clients', enrichedData);
      console.log('✅ Réponse serveur:', response.data);
      
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      console.error('❌ Erreur création client:', error);
      throw this.handleError(error, 'Erreur lors de la création du client');
    }
  }

  // ✅ MÉTHODES EXISTANTES CONSERVÉES
  async updateClient(clientId, clientData) {
    try {
      console.log('📱 API: PUT /clients/', clientId, clientData);
      const response = await this.axios.put(`/clients/${clientId}`, clientData);
      return this.formatResponse(response, 'Client mis à jour avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du client');
    }
  }

  async updateClientStatus(clientId, newStatus) {
    try {
      console.log('🔄 API: PUT /clients/{}/status', clientId);
      const response = await this.axios.put(`/clients/${clientId}/status`, {
        valide: newStatus
      });
      return this.formatResponse(response, 'Statut du client mis à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour statut client:', error);
      throw this.handleError(error, 'Erreur lors de la mise à jour du statut');
    }
  }

  async deleteClient(clientId) {
    try {
      console.log('📱 API: DELETE /clients/', clientId);
      const response = await this.axios.delete(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client supprimé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression du client');
    }
  }

  async searchClients(query, collecteurId) {
    try {
      console.log('📱 API: GET /clients/search');
      const params = { 
        q: query,
        collecteurId: collecteurId
      };
      
      const response = await this.axios.get('/clients/search', { params });
      return this.formatResponse(response, 'Recherche de clients effectuée');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la recherche de clients');
    }
  }

  // ✅ MÉTHODES UTILITAIRES AMÉLIORÉES
  formatTransactionDate(dateString) {
    try {
      if (!dateString) return 'Date inconnue';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = today.getTime() - transactionDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays <= 7) {
        return `Il y a ${diffDays} jours`;
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  }

  formatCurrency(amount) {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) return '0';
      return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return '0';
    }
  }

  getTransactionTypeLabel(transaction) {
    const type = transaction.typeMouvement || transaction.sens || 'INCONNU';
    
    switch (type.toUpperCase()) {
      case 'EPARGNE':
        return 'Épargne';
      case 'RETRAIT':
        return 'Retrait';
      case 'DEPOT':
        return 'Dépôt';
      case 'TRANSFERT':
        return 'Transfert';
      default:
        return type;
    }
  }

  // ✅ VALIDATION CÔTÉ CLIENT ROBUSTE
  validateClientDataLocally(clientData) {
    const errors = {};
    
    if (!clientData.nom?.trim()) {
      errors.nom = 'Le nom est requis';
    }
    
    if (!clientData.prenom?.trim()) {
      errors.prenom = 'Le prénom est requis';
    }
    
    if (!clientData.numeroCni?.trim()) {
      errors.numeroCni = 'Le numéro CNI est requis';
    }
    
    if (!clientData.telephone?.trim()) {
      errors.telephone = 'Le numéro de téléphone est requis';
    } else if (!/^(\+237|237)?[6-9][0-9]{8}$/.test(clientData.telephone.replace(/\s/g, ''))) {
      errors.telephone = 'Numéro de téléphone invalide (format camerounais attendu)';
    }
    
    if (!clientData.ville?.trim()) {
      errors.ville = 'La ville est requise';
    }

    if (!clientData.collecteurId) {
      errors.collecteurId = 'ID collecteur manquant';
    }

    if (!clientData.agenceId) {
      errors.agenceId = 'ID agence manquant';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ✅ MÉTHODES UTILITAIRES EXISTANTES
  formatClientForDisplay(client) {
    return {
      ...client,
      displayName: `${client.prenom} ${client.nom}`,
      statusText: client.valide ? 'Actif' : 'Inactif',
      formattedPhone: this.formatPhoneNumber(client.telephone),
      fullAddress: `${client.ville}${client.quartier ? ', ' + client.quartier : ''}`,
    };
  }

  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9 && cleaned.startsWith('6')) {
      return `+237 ${cleaned.substring(0, 1)}${cleaned.substring(1, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
    }
    
    return phone;
  }

  // ✅ MÉTHODE DE DÉBOGAGE AMÉLIORÉE
  async testConnection() {
    try {
      const user = await authService.getCurrentUser();
      console.log('🔍 Test connexion - Utilisateur:', user);
      
      if (!user) {
        return { success: false, error: 'Pas d\'utilisateur connecté' };
      }
      
      // Test simple avec un GET
      const response = await this.axios.get('/clients/collecteur/' + user.id);
      return { 
        success: true, 
        message: 'Connexion OK',
        user: user,
        dataCount: response.data?.length || 0
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data || 'Pas de détails'
      };
    }
  }

  // ✅ NOUVELLE MÉTHODE - CACHE LOCAL SIMPLE
  async getCachedClientDetails(clientId) {
    const cacheKey = `client_details_${clientId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Cache valide pendant 5 minutes
        if (now - parsedCache.timestamp < 5 * 60 * 1000) {
          console.log('📱 Utilisation cache client:', clientId);
          return parsedCache.data;
        }
      } catch (error) {
        console.error('Erreur lecture cache:', error);
      }
    }
    
    // Pas de cache valide, récupérer depuis l'API
    const freshData = await this.getClientDetails(clientId);
    
    // Sauvegarder en cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erreur sauvegarde cache:', error);
    }
    
    return freshData;
  }

  // ✅ MÉTHODE POUR NETTOYER LE CACHE
  clearCache(clientId = null) {
    try {
      if (clientId) {
        localStorage.removeItem(`client_details_${clientId}`);
      } else {
        // Nettoyer tout le cache client
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('client_details_')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Erreur nettoyage cache:', error);
    }
  }
}

export default new ClientService();