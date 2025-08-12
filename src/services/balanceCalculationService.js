// src/services/balanceCalculationService.js - SERVICE CALCUL SOLDE DISPONIBLE
import BaseApiService from './base/BaseApiService';
import commissionV2Service from './commissionV2Service';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Service pour calculer le solde disponible des clients
 * Le solde disponible = solde total - commission simulée mensuelle
 */
class BalanceCalculationService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Calcule le solde disponible d'un client
   * @param {Object} client - Données du client avec soldeTotal
   * @returns {Object} { soldeTotal, soldeDisponible, commissionSimulee }
   */
  async calculateClientAvailableBalance(client) {
    try {
      console.log('💰 Calcul solde disponible pour client:', client.id);

      // 🔥 ADAPTATION API SPRING BOOT - Récupération du solde depuis le compte
      let soldeTotal = 0;
      
      if (client.soldeTotal && typeof client.soldeTotal === 'number') {
        // Cas 1: soldeTotal déjà présent depuis backend /with-transactions
        soldeTotal = client.soldeTotal;
        console.log('💡 Solde extrait directement du backend:', soldeTotal);
      } else if (client.compteClient && client.compteClient.solde && typeof client.compteClient.solde === 'number') {
        // Cas 2: solde dans compteClient (API Spring Boot)
        soldeTotal = client.compteClient.solde;
        console.log('💡 Solde extrait de compteClient:', soldeTotal);
      } else if (Array.isArray(client.comptes) && client.comptes.length > 0) {
        // Cas 3: multiple comptes - prendre le premier
        const compte = client.comptes.find(c => c.solde !== undefined);
        soldeTotal = compte?.solde || 0;
        console.log('💡 Solde extrait du premier compte:', soldeTotal);
      } else {
        console.warn('⚠️ Aucun solde trouvé pour le client:', {
          id: client.id,
          hasCompteClient: !!client.compteClient,
          hasComptes: Array.isArray(client.comptes),
          hasSoldeTotal: !!client.soldeTotal,
          clientKeys: Object.keys(client)
        });
      }

      // Validation du solde trouvé
      if (typeof soldeTotal !== 'number' || isNaN(soldeTotal)) {
        console.warn('⚠️ Solde invalide détecté:', soldeTotal);
        return {
          soldeTotal: 0,
          soldeDisponible: 0,
          commissionSimulee: 0,
          error: 'Solde client invalide'
        };
      }

      // Logging pour debug des paramètres de commission
      console.log('🔍 Paramètres de commission client:', {
        clientId: client.id,
        hasCommissionParameter: !!client.commissionParameter,
        commissionParameter: client.commissionParameter
      });

      // Si pas de paramètres de commission, pas de déduction
      if (!client.commissionParameter) {
        console.log('💡 Aucun paramètre de commission - solde disponible = solde total');
        return {
          soldeTotal: soldeTotal,
          soldeDisponible: soldeTotal,
          commissionSimulee: 0
        };
      }

      // Créer un objet client enrichi avec le solde pour les calculs de commission
      const clientEnrichi = { ...client, soldeTotal };

      // Calcul de la commission simulée pour le mois en cours
      const commissionSimulee = await this.calculateMonthlyCommissionSimulation(clientEnrichi);

      // Calcul du solde disponible
      const soldeDisponible = Math.max(0, soldeTotal - commissionSimulee);

      console.log('✅ Soldes calculés:', {
        soldeTotal: soldeTotal,
        commissionSimulee,
        soldeDisponible
      });

      return {
        soldeTotal: soldeTotal,
        soldeDisponible,
        commissionSimulee
      };

    } catch (error) {
      console.error('❌ Erreur calcul solde disponible:', error);
      // Récupération du solde même en cas d'erreur
      let soldeSecours = 0;
      if (client?.soldeTotal) {
        soldeSecours = client.soldeTotal;
      } else if (client?.compteClient?.solde) {
        soldeSecours = client.compteClient.solde;
      } else if (client?.comptes?.[0]?.solde) {
        soldeSecours = client.comptes[0].solde;
      }

      return {
        soldeTotal: soldeSecours,
        soldeDisponible: soldeSecours,
        commissionSimulee: 0,
        error: error.message
      };
    }
  }

  /**
   * Simule le calcul de commission mensuelle sans l'appliquer
   * @param {Object} client - Données du client
   * @returns {number} Montant de la commission simulée
   */
  async calculateMonthlyCommissionSimulation(client) {
    try {
      console.log('🧮 Simulation commission mensuelle pour client:', client.id);

      const params = client.commissionParameter;
      if (!params) {
        console.log('💡 Aucun paramètre de commission trouvé');
        return 0;
      }

      // Période du mois en cours
      const now = new Date();
      const dateDebut = startOfMonth(now);
      const dateFin = endOfMonth(now);

      console.log('📅 Période simulation:', {
        dateDebut: format(dateDebut, 'yyyy-MM-dd'),
        dateFin: format(dateFin, 'yyyy-MM-dd')
      });

      // Calcul selon le type de commission
      let commissionCalculee = 0;
      const typeCommission = params.type || params.typeCommission;
      
      // 🔥 CORRECTION: Normaliser les types de commission
      const normalizedType = typeCommission?.toUpperCase();

      switch (normalizedType) {
        case 'POURCENTAGE':
        case 'PERCENTAGE':
          commissionCalculee = this.calculatePercentageCommission(client, params);
          break;
        case 'FIXE':
        case 'FIXED':
          commissionCalculee = this.calculateFixedCommission(client, params);
          break;
        case 'PALIER':
        case 'TIER':
          commissionCalculee = this.calculateTieredCommission(client, params);
          break;
        default:
          console.warn('⚠️ Type de commission non reconnu:', typeCommission);
          commissionCalculee = 0;
      }

      console.log('💰 Commission simulée calculée:', commissionCalculee);
      return Math.max(0, commissionCalculee); // Pas de commission négative

    } catch (error) {
      console.error('❌ Erreur simulation commission:', error);
      return 0;
    }
  }

  /**
   * Calcul commission par pourcentage
   */
  calculatePercentageCommission(client, params) {
    const pourcentage = params.valeur || params.pourcentage || 0;
    const commission = (client.soldeTotal * pourcentage) / 100;
    
    console.log('📊 Commission pourcentage:', {
      soldeTotal: client.soldeTotal,
      pourcentage,
      commission
    });

    return commission;
  }

  /**
   * Calcul commission fixe
   */
  calculateFixedCommission(client, params) {
    const montantFixe = params.valeur || params.montantFixe || 0;
    
    console.log('📊 Commission fixe:', {
      montantFixe
    });

    return montantFixe;
  }

  /**
   * Calcul commission par paliers
   */
  calculateTieredCommission(client, params) {
    const paliers = params.paliersCommission || params.paliers || [];
    const solde = client.soldeTotal;
    let commission = 0;

    console.log('📊 Commission paliers:', {
      solde,
      nombrePaliers: paliers.length
    });

    // Tri des paliers par montant minimum
    const paliersOrdonnes = paliers.sort((a, b) => a.montantMin - b.montantMin);

    for (const palier of paliersOrdonnes) {
      if (solde >= palier.montantMin) {
        const montantMax = palier.montantMax || Infinity;
        const montantApplicable = Math.min(solde, montantMax) - palier.montantMin;
        
        if (montantApplicable > 0) {
          const commissionPalier = (montantApplicable * palier.pourcentage) / 100;
          commission += commissionPalier;
          
          console.log('📊 Palier appliqué:', {
            montantMin: palier.montantMin,
            montantMax: palier.montantMax,
            montantApplicable,
            pourcentage: palier.pourcentage,
            commissionPalier
          });
        }
      }
    }

    return commission;
  }

  /**
   * Calcule les soldes pour une liste de clients
   * @param {Array} clients - Liste des clients
   * @returns {Array} Clients avec soldes calculés
   */
  async calculateMultipleClientsBalances(clients) {
    try {
      console.log('🔄 Calcul soldes multiples pour', clients.length, 'clients');

      const promises = clients.map(async (client) => {
        const balances = await this.calculateClientAvailableBalance(client);
        return {
          ...client,
          ...balances
        };
      });

      const results = await Promise.all(promises);
      console.log('✅ Calculs terminés pour tous les clients');

      return results;

    } catch (error) {
      console.error('❌ Erreur calcul soldes multiples:', error);
      // Retourner les clients avec leurs soldes originaux en cas d'erreur
      return clients.map(client => ({
        ...client,
        soldeTotal: client.soldeTotal || 0,
        soldeDisponible: client.soldeTotal || 0,
        commissionSimulee: 0,
        error: error.message
      }));
    }
  }

  /**
   * Vérifie si un client peut effectuer un retrait
   * @param {Object} client - Données du client
   * @param {number} montantRetrait - Montant souhaité du retrait
   * @returns {Object} { possible, soldeDisponible, message }
   */
  async canClientWithdraw(client, montantRetrait) {
    try {
      const balances = await this.calculateClientAvailableBalance(client);
      const possible = balances.soldeDisponible >= montantRetrait;

      return {
        possible,
        soldeDisponible: balances.soldeDisponible,
        message: possible 
          ? 'Retrait autorisé'
          : `Solde insuffisant. Disponible: ${balances.soldeDisponible} FCFA`
      };

    } catch (error) {
      return {
        possible: false,
        soldeDisponible: 0,
        message: 'Erreur lors de la vérification du solde'
      };
    }
  }
}

// Export de l'instance singleton
const balanceCalculationService = new BalanceCalculationService();
export default balanceCalculationService;