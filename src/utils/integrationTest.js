// src/utils/integrationTest.js
import ApiService from '../services/apiService';

export const runIntegrationTests = async () => {
  const results = [];
  
  // Test 1: Ping
  try {
    const pingResult = await ApiService.ping();
    results.push({ test: 'Ping', success: pingResult.success });
  } catch (e) {
    results.push({ test: 'Ping', success: false, error: e.message });
  }
  
  // Test 2: Collecteurs
  try {
    const collecteursResult = await ApiService.getCollecteurs();
    results.push({ test: 'Collecteurs', success: collecteursResult.success });
  } catch (e) {
    results.push({ test: 'Collecteurs', success: false, error: e.message });
  }
  
  // Test 3: Dashboard (avec un ID factice)
  try {
    const dashboardResult = await ApiService.getCollecteurDashboard(1);
    results.push({ test: 'Dashboard', success: dashboardResult.success });
  } catch (e) {
    results.push({ test: 'Dashboard', success: false, error: e.message });
  }
  
  return results;
};