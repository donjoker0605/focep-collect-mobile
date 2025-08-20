// src/utils/activityFormatter.js
/**
 * Formatteur intelligent pour les activités du journal
 * Gère l'affichage user-friendly des données JSON techniques
 */

import clientService from '../services/clientService';

class ActivityFormatter {
  constructor() {
    this.clientCache = new Map(); // Cache pour éviter les appels API répétés
  }

  /**
   * Formate la monnaie en français
   */
  formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  /**
   * Récupère le nom du client depuis les détails ou via API
   */
  getClientName = async (details, entityId = null) => {
    // Essayer d'abord depuis les détails - TOUTES LES VARIANTES POSSIBLES
    if (details) {
      // Variante 1: clientNom + clientPrenom
      if (details.clientNom || details.clientPrenom) {
        return `${details.clientPrenom || ''} ${details.clientNom || ''}`.trim();
      }
      
      // Variante 2: nomClient complet
      if (details.nomClient) {
        return details.nomClient;
      }
      
      // Variante 3: client { nom, prenom }
      if (details.client) {
        const client = details.client;
        if (client.nom || client.prenom) {
          return `${client.prenom || ''} ${client.nom || ''}`.trim();
        }
      }
      
      // Variante 4: Directement nom/prenom
      if (details.nom || details.prenom) {
        return `${details.prenom || ''} ${details.nom || ''}`.trim();
      }
      
      // Variante 5: Format journal spring (souvent utilisé)
      if (details.clientFullName || details.clientName) {
        return details.clientFullName || details.clientName;
      }

      // 🔥 NOUVEAU: Variante 6 - Si on a seulement clientId, récupérer via API
      if (details.clientId && typeof details.clientId === 'number') {
        const clientName = await this.fetchClientNameById(details.clientId);
        if (clientName && clientName !== 'Client') {
          return clientName;
        }
      }
    }

    // DEBUG: Afficher la structure pour comprendre
    console.log('🔍 Structure détails pour récup nom client:', details);

    return 'Client'; // Fallback générique
  };

  /**
   * 🔥 NOUVEAU: Récupérer le nom du client via API avec cache
   */
  fetchClientNameById = async (clientId) => {
    try {
      // Vérifier le cache d'abord
      if (this.clientCache.has(clientId)) {
        console.log(`💾 Cache hit pour client ${clientId}`);
        return this.clientCache.get(clientId);
      }

      console.log(`🌐 Récupération API pour client ${clientId}`);
      
      // Appel API pour récupérer les détails du client
      const clientResponse = await clientService.getClientById(clientId);
      
      if (clientResponse.success && clientResponse.data) {
        const client = clientResponse.data;
        const clientName = `${client.prenom || ''} ${client.nom || ''}`.trim();
        
        if (clientName && clientName !== '') {
          // Mettre en cache pour éviter les appels répétés
          this.clientCache.set(clientId, clientName);
          console.log(`✅ Nom client récupéré: ${clientName}`);
          return clientName;
        }
      }

      console.warn(`⚠️ Impossible de récupérer le nom pour client ${clientId}`);
      return 'Client';
      
    } catch (error) {
      console.error(`❌ Erreur récupération nom client ${clientId}:`, error);
      return 'Client';
    }
  };

  /**
   * Formate intelligemment une activité selon son type - STYLE JOURNAL DES OPÉRATIONS
   */
  formatActivity = async (activity) => {
    const { action, details: rawDetails, entityId, timestamp } = activity;
    
    let details = null;
    try {
      details = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;
    } catch (e) {
      details = rawDetails;
    }

    if (!details || typeof details !== 'object') {
      return this.getBasicActionName(action);
    }

    const clientName = await this.getClientName(details, entityId);

    // 🔥 NOUVEAU FORMAT - Identique au journal des opérations AVEC MONTANT
    const formatters = {
      'TRANSACTION_EPARGNE': (d, client) => {
        const montant = d.montant ? `\n+${this.formatCurrency(d.montant)}` : '';
        return `Epargne client : ${client.toLowerCase()}${montant}`;
      },
      'TRANSACTION_RETRAIT': (d, client) => {
        const montant = d.montant ? `\n-${this.formatCurrency(d.montant)}` : '';
        return `Retrait client : ${client.toLowerCase()}${montant}`;
      },
      'CREATE_CLIENT': (d, client) => `Nouveau client : ${client.toLowerCase()}`,
      'MODIFY_CLIENT': (d, client) => `Modification client : ${client.toLowerCase()}`,
      'DELETE_CLIENT': (d, client) => `Suppression client : ${client.toLowerCase()}`,
      'JOURNAL_CLOSE': (d) => `Journal clôturé (${d.totalOperations || 0} opérations)`,
      'JOURNAL_CREATE': () => `Nouveau journal créé`,
      'COMMISSION_CALCULATE': (d, client) => {
        const commission = d.montantCommission ? `\n${this.formatCurrency(d.montantCommission)}` : '';
        return `Commission calculée : ${client.toLowerCase()}${commission}`;
      },
      'LOGIN': () => `Connexion utilisateur`,
      'LOGOUT': () => `Déconnexion utilisateur`,
      'SYNC': () => `Synchronisation données`,
    };

    const formatter = formatters[action];
    if (formatter) {
      try {
        return formatter(details, clientName);
      } catch (e) {
        console.warn('Erreur formatage activité:', e);
      }
    }

    // Formatage générique
    if (details.montant) {
      return `Opération : ${clientName.toLowerCase()}`;
    }

    if (clientName !== 'Client') {
      return `Action : ${clientName.toLowerCase()}`;
    }

    return this.getBasicActionName(action);
  };

  /**
   * Noms de base pour les actions - STYLE JOURNAL DES OPÉRATIONS
   */
  getBasicActionName = (action) => {
    const names = {
      'CREATE_CLIENT': 'Client créé',
      'MODIFY_CLIENT': 'Client modifié', 
      'DELETE_CLIENT': 'Client supprimé',
      'TRANSACTION_EPARGNE': 'Épargne',
      'TRANSACTION_RETRAIT': 'Retrait',
      'LOGIN': 'Connexion',
      'LOGOUT': 'Déconnexion', 
      'JOURNAL_CREATE': 'Journal créé',
      'JOURNAL_CLOSE': 'Journal clôturé',
      'COMMISSION_CALCULATE': 'Commission calculée',
      'SYNC': 'Synchronisation',
      'SYSTEM': 'Système',
      'ERROR': 'Erreur',
      'WARNING': 'Avertissement',
      'INFO': 'Information'
    };
    return names[action] || action;
  };

  /**
   * Obtient la couleur pour une action
   */
  getActionColor = (action, theme) => {
    const colors = {
      'CREATE_CLIENT': theme.colors.success,
      'MODIFY_CLIENT': theme.colors.warning,
      'DELETE_CLIENT': theme.colors.error,
      'TRANSACTION_EPARGNE': theme.colors.success,
      'TRANSACTION_RETRAIT': theme.colors.warning,
      'LOGIN': theme.colors.primary,
      'LOGOUT': theme.colors.textSecondary,
      'JOURNAL_CREATE': theme.colors.info,
      'JOURNAL_CLOSE': theme.colors.success,
      'COMMISSION_CALCULATE': theme.colors.secondary,
      'SYNC': theme.colors.info,
      'SYSTEM': theme.colors.textSecondary,
      'ERROR': theme.colors.error,
      'WARNING': theme.colors.warning,
      'INFO': theme.colors.info
    };
    return colors[action] || theme.colors.textSecondary;
  };

  /**
   * Obtient l'icône pour une action
   */
  getActionIcon = (action) => {
    const icons = {
      'CREATE_CLIENT': 'person-add',
      'MODIFY_CLIENT': 'create',
      'DELETE_CLIENT': 'person-remove',
      'TRANSACTION_EPARGNE': 'arrow-up-circle',
      'TRANSACTION_RETRAIT': 'arrow-down-circle',
      'LOGIN': 'log-in',
      'LOGOUT': 'log-out',
      'JOURNAL_CREATE': 'document-text',
      'JOURNAL_CLOSE': 'checkmark-circle',
      'COMMISSION_CALCULATE': 'calculator',
      'SYNC': 'sync',
      'SYSTEM': 'settings',
      'ERROR': 'alert-circle',
      'WARNING': 'warning',
      'INFO': 'information-circle'
    };
    return icons[action] || 'document';
  };
}

// Export singleton
export default new ActivityFormatter();