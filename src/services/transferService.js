src/services/transferService.js
import BaseApiService from './base/BaseApiService';

class TransferService extends BaseApiService {
  constructor() {
    super();
  }

  async transferComptes(transferData) {
    try {
      console.log('📱 API: POST /transfers/collecteurs', transferData);
      
      const response = await this.axios.post('/transfers/collecteurs', transferData.clientIds, {
        params: {
          sourceCollecteurId: transferData.sourceCollecteurId,
          targetCollecteurId: transferData.destinationCollecteurId || transferData.targetCollecteurId
        }
      });
      
      return this.formatResponse(response, 'Transfert effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert');
    }
  }
}

export default new TransferService();