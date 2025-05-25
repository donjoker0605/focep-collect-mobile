import BaseApiService from './base/BaseApiService';
import authService from './authService';

class TestService extends BaseApiService {
  constructor() {
    super();
  }

  // Test de connectivité avec le backend
  async testConnectivity() {
    try {
      console.log('Testing backend connectivity...');
      const response = await this.ping();
      console.log('Connectivity test success:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test d'authentification
  async testAuthentication() {
    const testCredentials = {
      admin: {
        email: 'admin@collectfocep.com',
        password: 'password'
      },
      collecteur: {
        email: 'dimitri.mbianga@collectfocep.com',
        password: 'password'
      }
    };

    const results = {};

    for (const [role, credentials] of Object.entries(testCredentials)) {
      try {
        console.log(`Testing ${role} authentication...`);
        const result = await authService.login(credentials.email, credentials.password);
        
        if (result.success) {
          console.log(`${role} authentication success`);
          results[role] = { success: true, user: result.user };
          
          // Déconnexion immédiate après test
          await authService.logout();
        } else {
          console.error(`${role} authentication failed:`, result.error);
          results[role] = { success: false, error: result.error };
        }
      } catch (error) {
        console.error(`${role} authentication error:`, error);
        results[role] = { success: false, error: error.message };
      }
    }

    return results;
  }

  // Test complet du système
  async runFullTest() {
    console.log('Starting full system test...');
    
    const testResults = {
      connectivity: null,
      authentication: null,
      timestamp: new Date().toISOString(),
    };

    // Test de connectivité
    testResults.connectivity = await this.testConnectivity();
    
    if (testResults.connectivity.success) {
      // Test d'authentification seulement si la connectivité fonctionne
      testResults.authentication = await this.testAuthentication();
    }

    console.log('Full test completed:', testResults);
    return testResults;
  }

  // Format des résultats pour affichage
  formatTestResults(results) {
    let report = `=== Test Results ===\n`;
    report += `Time: ${new Date(results.timestamp).toLocaleString()}\n\n`;
    
    report += `Connectivity: ${results.connectivity.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
    if (!results.connectivity.success) {
      report += `Error: ${results.connectivity.error}\n`;
    }
    
    if (results.authentication) {
      report += `\nAuthentication Tests:\n`;
      for (const [role, result] of Object.entries(results.authentication)) {
        report += `  ${role}: ${result.success ? '✅' : '❌'}\n`;
        if (!result.success) {
          report += `    Error: ${result.error}\n`;
        }
      }
    }
    
    return report;
  }
}

export default new TestService();