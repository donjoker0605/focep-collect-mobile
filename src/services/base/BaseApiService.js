// CRÉER : src/services/base/BaseApiService.js
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

  handleError(error, defaultMessage = 'Une erreur est survenue') {
    console.error('❌', defaultMessage, error);
    
    return {
      data: [],
      totalElements: 0,
      totalPages: 0,
      success: false,
      error: error.response?.data?.message || error.message || defaultMessage
    };
  }

  async ping() {
    try {
      console.log('📱 API: GET /public/ping');
      const response = await this.axios.get('/public/ping');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BaseApiService;