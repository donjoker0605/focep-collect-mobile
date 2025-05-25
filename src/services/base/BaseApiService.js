// src/services/base/BaseApiService.js
import axiosInstance from '../../api/axiosConfig';

class BaseApiService {
  constructor() {
    this.axios = axiosInstance;
  }

  formatResponse(response, message = 'Opération réussie') {
    const data = response.data || response;
    return {
      data: data?.data || data?.content || data,
      totalElements: data?.totalElements || 0,
      totalPages: data?.totalPages || 0,
      success: true,
      message
    };
  }

  // CORRECTION CRITIQUE : Lance une erreur au lieu de retourner un objet
  handleError(error, defaultMessage = 'Une erreur est survenue') {
    console.error('❌', defaultMessage, error);
    
    const errorObj = new Error(error.response?.data?.message || error.message || defaultMessage);
    errorObj.status = error.response?.status;
    errorObj.data = error.response?.data;
    errorObj.originalError = error;
    
    throw errorObj; // LANCE l'erreur au lieu de la retourner
  }

  async ping() {
    try {
      console.log('📱 API: GET /public/ping');
      const response = await this.axios.get('/public/ping');
      return { success: true, data: response };
    } catch (error) {
      this.handleError(error, 'Erreur de connectivité');
    }
  }
}

export default BaseApiService;