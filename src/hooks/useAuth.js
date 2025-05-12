// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personnalisé pour accéder au contexte d'authentification
 * 
 * @returns {Object} Contexte d'authentification
 * @property {Object|null} user - Données de l'utilisateur actuel ou null si non connecté
 * @property {boolean} isLoading - Indique si l'authentification est en cours de chargement
 * @property {boolean} isAuthenticated - Indique si l'utilisateur est authentifié
 * @property {Function} login - Fonction pour s'authentifier (email, password, role)
 * @property {Function} logout - Fonction pour se déconnecter
 * @property {Function} register - Fonction pour créer un compte
 * @property {Function} updateUserInfo - Fonction pour mettre à jour les infos utilisateur
 * @property {Function} switchRole - Fonction pour changer de rôle en mode développement
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};

export default useAuth;