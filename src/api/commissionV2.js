// src/api/commissionV2.js
import axios from './axiosConfig';

/**
 * Service API pour les nouvelles fonctionnalités de commission FOCEP v2
 * Intégration du système refactorisé avec :
 * - Calcul commission hiérarchique (client → collecteur → agence)
 * - Système de rémunération Vi vs S
 * - Génération rapports Excel réels
 */

/**
 * Lance le calcul de commission complet pour un collecteur (NEW)
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date début (YYYY-MM-DD)
 * @param {string} params.dateFin Date fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Résultat complet avec détail par client
 */
export const calculateCommissionsV2 = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    console.log('📱 API V2: POST /commission-remuneration/collecteur/calculer');
    const response = await axios.post(
      `/api/v2/commission-remuneration/collecteur/${collecteurId}/calculer`,
      null,
      {
        params: { dateDebut, dateFin }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur calcul commission v2:', error);
    throw error;
  }
};

/**
 * Lance la rémunération d'un collecteur (NEW)
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @param {number} params.montantS Montant S (somme commissions)
 * @returns {Promise<Object>} Résultat rémunération avec détail Vi
 */
export const processRemuneration = async ({ collecteurId, montantS }) => {
  try {
    console.log('📱 API V2: POST /commission-remuneration/collecteur/remunerer');
    const response = await axios.post(
      `/api/v2/commission-remuneration/collecteur/${collecteurId}/remunerer`,
      null,
      {
        params: { montantS }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur rémunération:', error);
    throw error;
  }
};

/**
 * Processus complet : Commission + Rémunération en une seule API (NEW)
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date début (YYYY-MM-DD)
 * @param {string} params.dateFin Date fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Résultat consolidé commission + rémunération
 */
export const processusComplet = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    console.log('📱 API V2: POST /commission-remuneration/processus-complet');
    const response = await axios.post(
      `/api/v2/commission-remuneration/collecteur/${collecteurId}/processus-complet`,
      null,
      {
        params: { dateDebut, dateFin }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur processus complet:', error);
    throw error;
  }
};

/**
 * Génère et télécharge le rapport Excel de commission (NEW)
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date début (YYYY-MM-DD)
 * @param {string} params.dateFin Date fin (YYYY-MM-DD)
 * @returns {Promise<Blob>} Fichier Excel
 */
export const generateCommissionExcelReport = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    console.log('📱 API V2: POST /commission-remuneration/rapport-commission Excel');
    const response = await axios.post(
      `/api/v2/commission-remuneration/collecteur/${collecteurId}/rapport-commission`,
      null,
      {
        params: { dateDebut, dateFin },
        responseType: 'blob'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur génération rapport Excel commission:', error);
    throw error;
  }
};

/**
 * Génère et télécharge le rapport Excel de rémunération (NEW)
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date début (YYYY-MM-DD)
 * @param {string} params.dateFin Date fin (YYYY-MM-DD)
 * @returns {Promise<Blob>} Fichier Excel
 */
export const generateRemunerationExcelReport = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    console.log('📱 API V2: POST /commission-remuneration/rapport-remuneration Excel');
    const response = await axios.post(
      `/api/v2/commission-remuneration/collecteur/${collecteurId}/rapport-remuneration`,
      null,
      {
        params: { dateDebut, dateFin },
        responseType: 'blob'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur génération rapport Excel rémunération:', error);
    throw error;
  }
};

/**
 * Récupère le statut des commissions d'un collecteur (NEW)
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @returns {Promise<Object>} Statut et informations collecteur
 */
export const getCollecteurCommissionStatus = async ({ collecteurId }) => {
  try {
    console.log('📱 API V2: GET /commission-remuneration/statut');
    const response = await axios.get(
      `/api/v2/commission-remuneration/collecteur/${collecteurId}/statut`
    );
    return response.data;
  } catch (error) {
    console.error('Erreur récupération statut:', error);
    throw error;
  }
};

/**
 * GESTION DES RUBRIQUES DE RÉMUNÉRATION
 */

/**
 * Récupère les rubriques actives pour un collecteur
 * 
 * @param {Object} params
 * @param {string} params.collecteurId ID du collecteur
 * @returns {Promise<Array>} Liste des rubriques
 */
export const getRubriquesRemuneration = async ({ collecteurId }) => {
  try {
    console.log('📱 API V2: GET /rubriques-remuneration/collecteur');
    const response = await axios.get(
      `/api/v2/rubriques-remuneration/collecteur/${collecteurId}`
    );
    return response.data;
  } catch (error) {
    console.error('Erreur récupération rubriques:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle rubrique de rémunération
 * 
 * @param {Object} rubrique
 * @param {string} rubrique.nom Nom de la rubrique
 * @param {string} rubrique.type CONSTANT ou PERCENTAGE
 * @param {number} rubrique.valeur Valeur (montant ou pourcentage)
 * @param {string} rubrique.dateApplication Date d'application (YYYY-MM-DD)
 * @param {number} rubrique.delaiJours Délai en jours (optionnel)
 * @param {Array<number>} rubrique.collecteurIds IDs des collecteurs concernés
 * @returns {Promise<Object>} Rubrique créée
 */
export const createRubriqueRemuneration = async (rubrique) => {
  try {
    console.log('📱 API V2: POST /rubriques-remuneration');
    const response = await axios.post('/api/v2/rubriques-remuneration', rubrique);
    return response.data;
  } catch (error) {
    console.error('Erreur création rubrique:', error);
    throw error;
  }
};

/**
 * Met à jour une rubrique de rémunération
 * 
 * @param {Object} params
 * @param {number} params.rubriqueId ID de la rubrique
 * @param {Object} params.rubrique Données mises à jour
 * @returns {Promise<Object>} Rubrique mise à jour
 */
export const updateRubriqueRemuneration = async ({ rubriqueId, rubrique }) => {
  try {
    console.log('📱 API V2: PUT /rubriques-remuneration');
    const response = await axios.put(`/api/v2/rubriques-remuneration/${rubriqueId}`, rubrique);
    return response.data;
  } catch (error) {
    console.error('Erreur mise à jour rubrique:', error);
    throw error;
  }
};

/**
 * Désactive une rubrique de rémunération
 * 
 * @param {Object} params
 * @param {number} params.rubriqueId ID de la rubrique
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const deactivateRubriqueRemuneration = async ({ rubriqueId }) => {
  try {
    console.log('📱 API V2: DELETE /rubriques-remuneration');
    const response = await axios.delete(`/api/v2/rubriques-remuneration/${rubriqueId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur désactivation rubrique:', error);
    throw error;
  }
};

/**
 * UTILITAIRES
 */

/**
 * Télécharge un fichier Blob (Excel) sur le device
 * 
 * @param {Blob} blob Fichier à télécharger
 * @param {string} fileName Nom du fichier
 */
export const downloadExcelFile = async (blob, fileName) => {
  try {
    console.log(`📱 Téléchargement: ${fileName} (${blob.size} bytes)`);
    
    // Import dynamique pour éviter les erreurs de bundle
    const fileDownloader = await import('../utils/fileDownloader');
    const result = await fileDownloader.default.downloadExcelFile(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
      downloadResult: result
    };
  } catch (error) {
    console.error('Erreur téléchargement Excel:', error);
    throw error;
  }
};

/**
 * Formate les données de commission pour l'affichage mobile
 * 
 * @param {Object} commissionResult Résultat du calcul de commission
 * @returns {Object} Données formatées pour l'UI mobile
 */
export const formatCommissionDataForMobile = (commissionResult) => {
  if (!commissionResult || !commissionResult.commissionsClients) {
    return null;
  }

  return {
    collecteurId: commissionResult.collecteurId,
    periode: commissionResult.periode,
    totalCommissions: commissionResult.montantSCollecteur,
    totalTVA: commissionResult.totalTVA,
    nombreClients: commissionResult.commissionsClients.length,
    clients: commissionResult.commissionsClients.map(client => ({
      id: client.clientId,
      nom: client.clientNom,
      montantEpargne: client.montantEpargne,
      commission: client.commissionX,
      tva: client.tva,
      ancienSolde: client.ancienSolde,
      nouveauSolde: client.nouveauSolde,
      typeParametre: client.parameterUsed
    })),
    dateCalcul: commissionResult.dateCalcul
  };
};

/**
 * Formate les données de rémunération pour l'affichage mobile
 * 
 * @param {Object} remunerationResult Résultat de la rémunération
 * @returns {Object} Données formatées pour l'UI mobile
 */
export const formatRemunerationDataForMobile = (remunerationResult) => {
  if (!remunerationResult) {
    return null;
  }

  return {
    collecteurId: remunerationResult.collecteurId,
    montantSInitial: remunerationResult.montantSInitial,
    totalRubriquesVi: remunerationResult.totalRubriqueVi,
    montantEMF: remunerationResult.montantEMF,
    nombreMovements: remunerationResult.mouvements?.length || 0,
    success: remunerationResult.success
  };
};