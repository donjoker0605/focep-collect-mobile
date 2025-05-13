# scripts/migrate_to_real_api.ps1
# Script automatisé pour migrer des mocks vers l'API réelle

Write-Host "🚀 Début de la migration vers l'API réelle..." -ForegroundColor Green

# 1. Configuration API
Write-Host "📝 Configuration de l'API..." -ForegroundColor Yellow
$apiConfigContent = @"
// src/config/apiConfig.js
export const API_CONFIG = {
  baseURL: 'http://192.168.88.60:8080/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const STORAGE_KEYS = {
  JWT_TOKEN: 'jwt_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  IS_FIRST_LAUNCH: 'is_first_launch',
};

// Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PING: '/public/ping',
  
  // Collecteurs
  COLLECTEURS: '/collecteurs',
  COLLECTEURS_BY_AGENCE: '/collecteurs/agence',
  
  // Clients
  CLIENTS: '/clients',
  CLIENTS_BY_COLLECTEUR: '/clients/collecteur',
  
  // Comptes
  COMPTES: '/comptes',
  COMPTES_BY_CLIENT: '/comptes/client',
  COMPTES_BY_COLLECTEUR: '/comptes/collecteur',
  COMPTES_SOLDE: '/comptes/{id}/solde',
  
  // Mouvements
  MOUVEMENTS_EPARGNE: '/mouvements/epargne',
  MOUVEMENTS_RETRAIT: '/mouvements/retrait',
  MOUVEMENTS_BY_JOURNAL: '/mouvements/journal',
  
  // Journaux
  JOURNAUX: '/journaux',
  JOURNAUX_BY_COLLECTEUR: '/journaux/collecteur',
  JOURNAUX_CLOTURE: '/journaux/cloture',
  
  // Commissions
  COMMISSIONS_PROCESS: '/commissions/process',
  COMMISSIONS_STATUS: '/commissions/status',
  COMMISSIONS_BY_COLLECTEUR: '/commissions/collecteur',
  
  // Reports
  REPORTS_COLLECTEUR_MONTHLY: '/reports/collecteur/{id}/monthly',
  REPORTS_AGENCE: '/reports/agence/{id}',
};
"@

# Créer le fichier de configuration
$configDir = "src/config"
if (!(Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force
}
Set-Content -Path "$configDir/apiConfig.js" -Value $apiConfigContent

# 2. Configuration Axios
Write-Host "⚙️ Configuration d'Axios..." -ForegroundColor Yellow
$axiosConfigContent = @"
// src/api/axiosConfig.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/apiConfig';

// Créer l'instance Axios
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor pour ajouter le token aux requêtes
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer `${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tentative de refresh token si disponible
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          // Logique de refresh token si votre API le supporte
          // Pour l'instant, on redirige vers login
        }
        
        // Supprimer les tokens et rediriger vers login
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.JWT_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA,
        ]);
        
        // Naviguer vers login - vous devrez adapter selon votre navigation
        // NavigationService.reset('Login');
        
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Fonctions utilitaires
export const handleApiError = (error) => {
  if (error.response) {
    // Erreur avec réponse du serveur
    const { status, data } = error.response;
    return {
      status,
      message: data.message || 'Une erreur est survenue',
      details: data.details || null,
    };
  } else if (error.request) {
    // Erreur réseau
    return {
      status: 0,
      message: 'Erreur de connexion. Vérifiez votre connexion internet.',
      details: null,
    };
  } else {
    // Autre erreur
    return {
      status: -1,
      message: error.message || 'Une erreur inattendue est survenue',
      details: null,
    };
  }
};

export const createApiCall = (endpoint, method = 'GET', data = null, options = {}) => {
  const config = {
    method,
    url: endpoint,
    ...options,
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.data = data;
  }
  
  return api(config);
};
"@

# Créer le fichier axios config
$apiDir = "src/api"
if (!(Test-Path $apiDir)) {
    New-Item -ItemType Directory -Path $apiDir -Force
}
Set-Content -Path "$apiDir/axiosConfig.js" -Value $axiosConfigContent

# 3. Service d'authentification réel
Write-Host "🔐 Création du service d'authentification..." -ForegroundColor Yellow
$authServiceContent = @"
// src/api/auth.js
import api, { handleApiError } from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS, STORAGE_KEYS } from '../config/apiConfig';

export const authService = {
  // Test de connectivité avec le backend
  async ping() {
    try {
      const response = await api.get(ENDPOINTS.PING);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Connexion utilisateur
  async login(credentials) {
    try {
      const response = await api.post(ENDPOINTS.LOGIN, credentials);
      const { token, user } = response.data;
      
      // Stocker le token et les données utilisateur
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.JWT_TOKEN, token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);
      
      return { token, user };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Déconnexion
  async logout() {
    try {
      // Optionnel: notifier le serveur de la déconnexion
      // await api.post(ENDPOINTS.LOGOUT);
      
      // Supprimer les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Même en cas d'erreur, on supprime les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return true;
    }
  },

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      return !!token;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  },

  // Récupérer les données utilisateur stockées
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Vérifier la validité du token
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
"@

Set-Content -Path "$apiDir/auth.js" -Value $authServiceContent

# 4. Service collecteur
Write-Host "👥 Création du service collecteur..." -ForegroundColor Yellow
$collecteurServiceContent = @"
// src/api/collecteur.js
import api, { handleApiError } from './axiosConfig';
import { ENDPOINTS } from '../config/apiConfig';

export const collecteurService = {
  // Obtenir tous les collecteurs d'une agence
  async getByAgence(agenceId) {
    try {
      const response = await api.get(`${ENDPOINTS.COLLECTEURS_BY_AGENCE}/${agenceId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Créer un nouveau collecteur
  async create(collecteurData) {
    try {
      const response = await api.post(ENDPOINTS.COLLECTEURS, collecteurData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mettre à jour un collecteur
  async update(id, collecteurData) {
    try {
      const response = await api.put(`${ENDPOINTS.COLLECTEURS}/${id}`, collecteurData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Modifier le montant max de retrait
  async updateMontantMaxRetrait(collecteurId, data) {
    try {
      const response = await api.put(
        `${ENDPOINTS.COLLECTEURS}/${collecteurId}/montant-max`,
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Réinitialiser le mot de passe
  async resetPassword(collecteurId, newPassword) {
    try {
      const response = await api.post(
        `${ENDPOINTS.COLLECTEURS}/${collecteurId}/reset-password`,
        { newPassword }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir un collecteur par ID
  async getById(id) {
    try {
      const response = await api.get(`${ENDPOINTS.COLLECTEURS}/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
"@

Set-Content -Path "$apiDir/collecteur.js" -Value $collecteurServiceContent

# 5. Service client
Write-Host "🧑‍💼 Création du service client..." -ForegroundColor Yellow
$clientServiceContent = @"
// src/api/client.js
import api, { handleApiError } from './axiosConfig';
import { ENDPOINTS } from '../config/apiConfig';

export const clientService = {
  // Obtenir tous les clients
  async getAll() {
    try {
      const response = await api.get(ENDPOINTS.CLIENTS);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les clients d'un collecteur
  async getByCollecteur(collecteurId) {
    try {
      const response = await api.get(`${ENDPOINTS.CLIENTS_BY_COLLECTEUR}/${collecteurId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Créer un nouveau client
  async create(clientData) {
    try {
      const response = await api.post(ENDPOINTS.CLIENTS, clientData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mettre à jour un client
  async update(id, clientData) {
    try {
      const response = await api.put(`${ENDPOINTS.CLIENTS}/${id}`, clientData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Supprimer un client
  async delete(id) {
    try {
      const response = await api.delete(`${ENDPOINTS.CLIENTS}/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir un client par ID
  async getById(id) {
    try {
      const response = await api.get(`${ENDPOINTS.CLIENTS}/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Rechercher des clients
  async search(criteria) {
    try {
      const params = new URLSearchParams(criteria);
      const response = await api.get(`${ENDPOINTS.CLIENTS}/search?${params}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
"@

Set-Content -Path "$apiDir/client.js" -Value $clientServiceContent

# 6. Service comptes
Write-Host "💰 Création du service comptes..." -ForegroundColor Yellow
$compteServiceContent = @"
// src/api/compte.js
import api, { handleApiError } from './axiosConfig';
import { ENDPOINTS } from '../config/apiConfig';

export const compteService = {
  // Obtenir les comptes d'un client
  async getByClient(clientId) {
    try {
      const response = await api.get(`${ENDPOINTS.COMPTES_BY_CLIENT}/${clientId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les comptes d'un collecteur
  async getByCollecteur(collecteurId) {
    try {
      const response = await api.get(`${ENDPOINTS.COMPTES_BY_COLLECTEUR}/${collecteurId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir le solde d'un compte
  async getSolde(compteId) {
    try {
      const endpoint = ENDPOINTS.COMPTES_SOLDE.replace('{id}', compteId);
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir un compte par ID
  async getById(id) {
    try {
      const response = await api.get(`${ENDPOINTS.COMPTES}/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les comptes d'une agence
  async getByAgence(agenceId) {
    try {
      const response = await api.get(`${ENDPOINTS.COMPTES}/agence/${agenceId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
"@

Set-Content -Path "$apiDir/compte.js" -Value $compteServiceContent

# 7. Service mouvements
Write-Host "📋 Création du service mouvements..." -ForegroundColor Yellow
$mouvementServiceContent = @"
// src/api/mouvement.js
import api, { handleApiError } from './axiosConfig';
import { ENDPOINTS } from '../config/apiConfig';

export const mouvementService = {
  // Enregistrer une épargne
  async epargne(data) {
    try {
      const response = await api.post(ENDPOINTS.MOUVEMENTS_EPARGNE, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Effectuer un retrait
  async retrait(data) {
    try {
      const response = await api.post(ENDPOINTS.MOUVEMENTS_RETRAIT, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les mouvements d'un journal
  async getByJournal(journalId) {
    try {
      const response = await api.get(`${ENDPOINTS.MOUVEMENTS_BY_JOURNAL}/${journalId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les mouvements d'un client avec pagination
  async getByClient(clientId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(`/mouvements/client/${clientId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir l'historique des mouvements d'un collecteur
  async getByCollecteur(collecteurId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(`/mouvements/collecteur/${collecteurId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
"@

Set-Content -Path "$apiDir/mouvement.js" -Value $mouvementServiceContent

# 8. AuthContext mis à jour
Write-Host "🔒 Mise à jour du contexte d'authentification..." -ForegroundColor Yellow
$authContextContent = @"
// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../api/auth';

// Types d'actions
const ACTION_TYPES = {
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',
  RESTORE_TOKEN: 'RESTORE_TOKEN',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Reducer pour gérer l'état d'authentification
function authReducer(prevState, action) {
  switch (action.type) {
    case ACTION_TYPES.RESTORE_TOKEN:
      return {
        ...prevState,
        userToken: action.token,
        user: action.user,
        isLoading: false,
      };
    case ACTION_TYPES.SIGN_IN:
      return {
        ...prevState,
        isSignout: false,
        userToken: action.token,
        user: action.user,
        isLoading: false,
        error: null,
      };
    case ACTION_TYPES.SIGN_OUT:
      return {
        ...prevState,
        isSignout: true,
        userToken: null,
        user: null,
        isLoading: false,
        error: null,
      };
    case ACTION_TYPES.SET_LOADING:
      return {
        ...prevState,
        isLoading: action.payload,
      };
    case ACTION_TYPES.SET_ERROR:
      return {
        ...prevState,
        error: action.payload,
        isLoading: false,
      };
    default:
      return prevState;
  }
}

// État initial
const initialState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
};

// Créer le contexte
export const AuthContext = createContext({
  state: initialState,
  signIn: async () => {},
  signOut: async () => {},
  error: null,
});

// Provider du contexte d'authentification
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    const bootstrapAsync = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const user = await authService.getCurrentUser();
          const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          dispatch({ 
            type: ACTION_TYPES.RESTORE_TOKEN, 
            token, 
            user 
          });
        } else {
          dispatch({ type: ACTION_TYPES.RESTORE_TOKEN, token: null, user: null });
        }
      } catch (error) {
        console.error('Bootstrap error:', error);
        dispatch({ type: ACTION_TYPES.RESTORE_TOKEN, token: null, user: null });
      }
    };

    bootstrapAsync();
  }, []);

  const authActions = {
    signIn: async (credentials) => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      try {
        const { token, user } = await authService.login(credentials);
        dispatch({ type: ACTION_TYPES.SIGN_IN, token, user });
        return { success: true };
      } catch (error) {
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      }
    },

    signOut: async () => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      try {
        await authService.logout();
        dispatch({ type: ACTION_TYPES.SIGN_OUT });
      } catch (error) {
        console.error('Sign out error:', error);
        // Même en cas d'erreur, on déconnecte l'utilisateur localement
        dispatch({ type: ACTION_TYPES.SIGN_OUT });
      }
    },

    clearError: () => {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null });
    },
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        ...authActions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook pour accéder aux données de l'utilisateur connecté
export function useUser() {
  const { state } = useAuth();
  return {
    user: state.user,
    isAuthenticated: !!state.userToken,
    role: state.user?.roles?.[0],
  };
}
"@

$contextDir = "src/context"
if (!(Test-Path $contextDir)) {
    New-Item -ItemType Directory -Path $contextDir -Force
}
Set-Content -Path "$contextDir/AuthContext.js" -Value $authContextContent

# 9. Hook useClients mis à jour
Write-Host "🔗 Mise à jour des hooks..." -ForegroundColor Yellow
$useClientsContent = @"
// src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useClients(collecteurId = null) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { state } = useAuth();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (collecteurId) {
        data = await clientService.getByCollecteur(collecteurId);
      } else {
        data = await clientService.getAll();
      }
      setClients(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [collecteurId]);

  useEffect(() => {
    if (state.userToken) {
      fetchClients();
    }
  }, [fetchClients, state.userToken]);

  const createClient = async (clientData) => {
    try {
      const newClient = await clientService.create(clientData);
      setClients(prev => [...prev, newClient]);
      return { success: true, data: newClient };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      const updatedClient = await clientService.update(id, clientData);
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
      return { success: true, data: updatedClient };
    } catch (error) {
      return { success: false, error };
    }
  };

  const deleteClient = async (id) => {
    try {
      await clientService.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const searchClients = async (criteria) => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.search(criteria);
      return { success: true, data };
    } catch (error) {
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
  };
}
"@

$hooksDir = "src/hooks"
if (!(Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force
}
Set-Content -Path "$hooksDir/useClients.js" -Value $useClientsContent

# 10. Hook useCollecteurs mis à jour
Write-Host "👥 Hook useCollecteurs..." -ForegroundColor Yellow
$useCollecteursContent = @"
// src/hooks/useCollecteurs.js
import { useState, useEffect, useCallback } from 'react';
import { collecteurService } from '../api/collecteur';
import { useAuth } from '../context/AuthContext';

export function useCollecteurs(agenceId = null) {
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { state } = useAuth();

  const fetchCollecteurs = useCallback(async () => {
    if (!agenceId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await collecteurService.getByAgence(agenceId);
      setCollecteurs(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching collecteurs:', err);
    } finally {
      setLoading(false);
    }
  }, [agenceId]);

  useEffect(() => {
    if (state.userToken && agenceId) {
      fetchCollecteurs();
    }
  }, [fetchCollecteurs, state.userToken]);

  const createCollecteur = async (collecteurData) => {
    try {
      const newCollecteur = await collecteurService.create(collecteurData);
      setCollecteurs(prev => [...prev, newCollecteur]);
      return { success: true, data: newCollecteur };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updateCollecteur = async (id, collecteurData) => {
    try {
      const updatedCollecteur = await collecteurService.update(id, collecteurData);
      setCollecteurs(prev => prev.map(collecteur => 
        collecteur.id === id ? updatedCollecteur : collecteur
      ));
      return { success: true, data: updatedCollecteur };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updateMontantMax = async (collecteurId, data) => {
    try {
      const result = await collecteurService.updateMontantMaxRetrait(collecteurId, data);
      await fetchCollecteurs(); // Refetch pour avoir les données à jour
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    collecteurs,
    loading,
    error,
    refetch: fetchCollecteurs,
    createCollecteur,
    updateCollecteur,
    updateMontantMax,
  };
}
"@

Set-Content -Path "$hooksDir/useCollecteurs.js" -Value $useCollecteursContent

# 11. Supprimer les anciennes données mock
Write-Host "🗑️ Suppression des données mock..." -ForegroundColor Yellow

# Rechercher et lister tous les fichiers contenant __DEV__
$filesToUpdate = Get-ChildItem -Path "src" -Recurse -Include "*.js","*.jsx" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "__DEV__" }

Write-Host "📁 Fichiers contenant __DEV__ trouvés:" -ForegroundColor Cyan
$filesToUpdate | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Gray }

# Créer un backup avant modification
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "💾 Création d'un backup dans '$backupDir'..." -ForegroundColor Green
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$filesToUpdate | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $backupPath = Join-Path $backupDir $relativePath
    $backupDir = Split-Path $backupPath -Parent
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    Copy-Item $_.FullName $backupPath
}

# 12. Nettoyer les fichiers un par un
Write-Host "🧹 Nettoyage des conditions __DEV__..." -ForegroundColor Yellow

$filesToUpdate | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remplacer les conditions __DEV__ simples
    $content = $content -replace "if\s*\(\s*__DEV__\s*\)\s*{.*?}\s*else\s*{(.*?)}", '$1'
    
    # Remplacer les retours conditionnels
    $content = $content -replace "__DEV__\s*\?\s*(.*?)\s*:\s*(.*?);", '$2;'
    
    # Supprimer les blocs __DEV__ sans else
    $content = $content -replace "if\s*\(\s*__DEV__\s*\)\s*{.*?}(?!\s*else)", ''
    
    # Supprimer les imports mock inutiles
    $content = $content -replace "import.*mock.*from.*;\n?", ''
    
    # Supprimer les console.log en mode dev
    $content = $content -replace "if\s*\(\s*__DEV__\s*\)\s*console\.log.*;\n?", ''
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "  ✓ Nettoyé: $($file.Name)" -ForegroundColor Green
    }
}

# 13. Installation des dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install @react-native-async-storage/async-storage expo-secure-store axios

# 14. Création du fichier de test de connectivité
Write-Host "🔗 Création du composant de test..." -ForegroundColor Yellow
$testComponentContent = @"
// src/components/ConnectionTest.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { authService } from '../api/auth';
import { API_CONFIG } from '../config/apiConfig';

export default function ConnectionTest() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    setStatus('testing');
    setResult(null);
    
    try {
      const response = await authService.ping();
      setStatus('success');
      setResult({
        success: true,
        data: response,
        url: API_CONFIG.baseURL,
      });
    } catch (error) {
      setStatus('error');
      setResult({
        success: false,
        error: error.message,
        details: error.details,
        url: API_CONFIG.baseURL,
      });
    }
  };

  const testAuth = async () => {
    setStatus('testing');
    
    try {
      const response = await authService.login({
        email: 'admin@collectfocep.com',
        password: 'password'
      });
      
      Alert.alert(
        'Test d\'authentification',
        'Connexion réussie !',
        [{ text: 'OK' }]
      );
      
      setResult({
        success: true,
        data: response,
      });
    } catch (error) {
      Alert.alert(
        'Erreur d\'authentification',
        error.message,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de connectivité Backend</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>URL Backend:</Text>
        <Text style={styles.urlText}>{API_CONFIG.baseURL}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: getStatusColor() }]}
        onPress={testConnection}
        disabled={status === 'testing'}
      >
        <Text style={styles.buttonText}>
          {status === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.authButton]}
        onPress={testAuth}
        disabled={status === 'testing'}
      >
        <Text style={styles.buttonText}>
          Tester l'authentification
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Résultat:</Text>
          <Text style={[
            styles.resultText,
            { color: result.success ? '#4CAF50' : '#F44336' }
          ]}>
            {result.success ? '✓ Connexion établie' : '✗ Connexion échouée'}
          </Text>
          {!result.success && result.error && (
            <Text style={styles.errorText}>{result.error}</Text>
          )}
          {result.data && (
            <Text style={styles.dataText}>
              {JSON.stringify(result.data, null, 2)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  urlText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  authButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 10,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
"@

$componentsDir = "src/components"
if (!(Test-Path $componentsDir)) {
    New-Item -ItemType Directory -Path $componentsDir -Force
}
Set-Content -Path "$componentsDir/ConnectionTest.js" -Value $testComponentContent

# 15. Mise à jour du package.json scripts
Write-Host "📝 Ajout des scripts utiles..." -ForegroundColor Yellow
$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
    # Ajouter des scripts utiles
    if (!$packageJson.scripts) {
        $packageJson.scripts = @{}
    }
    
    $packageJson.scripts.'test:connection' = 'echo "Test de connexion via Expo Go - Ouvrir l'\''écran ConnectionTest"'
    $packageJson.scripts.'dev:clear' = 'expo r -c'
    $packageJson.scripts.'logs' = 'npx expo logs'
    
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
}

# 16. Création du guide de validation
Write-Host "📋 Création du guide de validation..." -ForegroundColor Yellow
$validationGuideContent = @"
# 🚀 Guide de validation de la migration

## 📋 Checklist post-migration

### 1. Configuration vérifiée
- [x] URL backend configurée dans `src/config/apiConfig.js`
- [x] Services API créés sans __DEV__
- [x] AuthContext mis à jour
- [x] Hooks mis à jour
- [x] Dépendances installées

### 2. Tests à effectuer

#### A. Test de connectivité basique
1. Lancer l'application: `npm start`
2. Aller à l'écran ConnectionTest
3. Cliquer sur "Tester la connexion"
4. Vérifier que le ping fonctionne

#### B. Test d'authentification
1. Cliquer sur "Tester l'authentification"
2. Vérifier la connexion avec les credentials par défaut
3. Vérifier que le token est reçu

#### C. Test des écrans principaux
1. Login → Dashboard
2. Vérifier que les données se chargent
3. Tester la navigation

### 3. Problèmes courants et solutions

#### Erreur de connexion
- Vérifier que le backend est démarré
- Vérifier l'IP dans apiConfig.js
- Vérifier que le mobile et le backend sont sur le même réseau

#### Erreur 401/403
- Vérifier les credentials de test
- Vérifier la configuration JWT côté backend

#### Erreur CORS
- Vérifier la configuration CORS du backend
- Ajouter l'IP du développement en whitelist

### 4. Commandes utiles

```bash
# Nettoyer le cache
npm run dev:clear

# Voir les logs
npm run logs

# Reinstaller les dépendances
rm -rf node_modules && npm install
```

### 5. Rollback si nécessaire

En cas de problème:
1. Arrêter l'application
2. Restaurer depuis le backup: `backup_[timestamp]`
3. Analyser les erreurs
4. Recommencer étape par étape

### 6. Prochaines étapes

Une fois la connexion validée:
1. Implémenter les services manquants (journal, mouvement, commission)
2. Mettre à jour tous les écrans pour utiliser les vraies données
3. Ajouter la gestion d'erreurs
4. Implémenter la synchronisation offline
5. Ajouter les tests unitaires

---

## 📞 Support

En cas de problème:
1. Vérifier les logs avec `npm run logs`
2. Tester avec Postman en parallèle
3. Vérifier la configuration réseau
"@

Set-Content -Path "MIGRATION_GUIDE.md" -Value $validationGuideContent

# 17. Résumé final
Write-Host "`n🎉 Migration terminée!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "✅ Configuration API créée" -ForegroundColor White
Write-Host "✅ Services API implémentés" -ForegroundColor White
Write-Host "✅ AuthContext mis à jour" -ForegroundColor White
Write-Host "✅ Hooks migrés" -ForegroundColor White
Write-Host "✅ Conditions __DEV__ supprimées" -ForegroundColor White
Write-Host "✅ Dépendances installées" -ForegroundColor White
Write-Host "✅ Composant de test créé" -ForegroundColor White
Write-Host "✅ Backup créé dans $backupDir" -ForegroundColor White

Write-Host "`n🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Lancer l'app: npm start" -ForegroundColor White
Write-Host "2. Tester avec ConnectionTest" -ForegroundColor White
Write-Host "3. Valider l'authentification" -ForegroundColor White
Write-Host "4. Vérifier le guide: MIGRATION_GUIDE.md" -ForegroundColor White

Write-Host "`n📱 L'application est prête pour être connectée au backend!" -ForegroundColor Green