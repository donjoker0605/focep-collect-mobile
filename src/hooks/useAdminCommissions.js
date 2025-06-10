// src/hooks/useAdminCommissions.js 
import { useState, useCallback } from 'react';
import adminCommissionService from '../services/adminCommissionService';
import { useErrorHandler } from './useErrorHandler';

export const useAdminCommissions = () => {
  const { handleError } = useErrorHandler();
  
  const [processing, setProcessing] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);

  const processCommissions = useCallback(async (collecteurId, dateDebut, dateFin, force = false) => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await adminCommissionService.processCommissions(
        collecteurId, dateDebut, dateFin, force
      );
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, [handleError]);

  const simulateCommission = useCallback(async (simulationData) => {
    try {
      setError(null);
      
      const response = await adminCommissionService.simulateCommission(simulationData);
      
      if (response.success) {
        setSimulationResult(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [handleError]);

  return {
    // États
    processing,
    simulationResult,
    error,
    
    // Actions
    processCommissions,
    simulateCommission,
    clearError: () => setError(null),
    clearSimulation: () => setSimulationResult(null)
  };
};