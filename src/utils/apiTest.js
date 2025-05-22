// src/utils/apiTest.js - OUTIL DE TEST DES ENDPOINTS
import { getClients } from '../api/client';
import { fetchJournalTransactions, getCollecteurDashboard } from '../api/transaction';
import { getNotifications } from '../api/notification';

export const testAllEndpoints = async (userId) => {
  console.log('🧪 Testing all endpoints for user:', userId);
  
  const results = {};
  
  // Test 1: Clients
  try {
    console.log('📋 Testing clients endpoint...');
    const clientsResult = await getClients({ collecteurId: userId, page: 0, size: 5 });
    results.clients = {
      success: clientsResult.success,
      data: clientsResult.data,
      count: clientsResult.data?.length || 0
    };
    console.log('✅ Clients test passed:', results.clients);
  } catch (error) {
    results.clients = { success: false, error: error.message };
    console.error('❌ Clients test failed:', error);
  }
  
  // Test 2: Transactions
  try {
    console.log('💰 Testing transactions endpoint...');
    const transactionsResult = await fetchJournalTransactions({ 
      collecteurId: userId, 
      page: 0, 
      size: 5 
    });
    results.transactions = {
      success: transactionsResult.success,
      data: transactionsResult.data,
      count: transactionsResult.data?.length || 0
    };
    console.log('✅ Transactions test passed:', results.transactions);
  } catch (error) {
    results.transactions = { success: false, error: error.message };
    console.error('❌ Transactions test failed:', error);
  }
  
  // Test 3: Dashboard
  try {
    console.log('📊 Testing dashboard endpoint...');
    const dashboardResult = await getCollecteurDashboard(userId);
    results.dashboard = {
      success: dashboardResult.success,
      data: dashboardResult.data
    };
    console.log('✅ Dashboard test passed:', results.dashboard);
  } catch (error) {
    results.dashboard = { success: false, error: error.message };
    console.error('❌ Dashboard test failed:', error);
  }
  
  // Test 4: Notifications
  try {
    console.log('🔔 Testing notifications endpoint...');
    const notificationsResult = await getNotifications(0, 5);
    results.notifications = {
      success: notificationsResult.success,
      data: notificationsResult.data,
      count: notificationsResult.data?.length || 0
    };
    console.log('✅ Notifications test passed:', results.notifications);
  } catch (error) {
    results.notifications = { success: false, error: error.message };
    console.error('❌ Notifications test failed:', error);
  }
  
  console.log('🏁 All tests completed:', results);
  return results;
};

// Fonction pour tester un endpoint spécifique
export const testEndpoint = async (endpointName, userId) => {
  switch(endpointName) {
    case 'clients':
      return await getClients({ collecteurId: userId, page: 0, size: 1 });
    case 'transactions':
      return await fetchJournalTransactions({ collecteurId: userId, page: 0, size: 1 });
    case 'dashboard':
      return await getCollecteurDashboard(userId);
    case 'notifications':
      return await getNotifications(0, 1);
    default:
      throw new Error(`Endpoint ${endpointName} non reconnu`);
  }
};