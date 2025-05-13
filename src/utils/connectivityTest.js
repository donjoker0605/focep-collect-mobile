// src/utils/connectivityTest.js
import { API_CONFIG } from '../config/apiConfig';

export const testBackendConnection = async () => {
  console.log('🔍 Test de connectivité vers:', API_CONFIG.baseURL);
  
  try {
    // Test 1: Ping endpoint
    console.log('Test 1: Ping...');
    const response = await fetch(`${API_CONFIG.baseURL}/public/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible:', data);
      return { success: true, data };
    } else {
      console.log('❌ Erreur HTTP:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Erreur de réseau:', error);
    return { success: false, error: error.message };
  }
};

// Utilisation dans un composant
export const useConnectivityTest = () => {
  const [status, setStatus] = useState('idle');
  
  const runTest = async () => {
    setStatus('testing');
    const result = await testBackendConnection();
    setStatus(result.success ? 'connected' : 'failed');
    return result;
  };
  
  return { status, runTest };
};