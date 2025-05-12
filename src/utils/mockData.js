// src/utils/mockData.js
// Fichier pour simuler les données pendant le développement

/**
 * Données fictives pour le développement en mode déconnecté
 * Ces données sont utilisées pour simuler les réponses API pendant le développement
 */

export const generateMockUserData = (email, role) => {
    return {
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      adresseMail: email,
      telephone: '+237 655 123 456',
      numeroCni: 'CM12345678',
      role: role || 'COLLECTEUR',
      agenceId: 1
    };
  };
  
  export const mockTransactions = [
    {
      id: 1,
      type: 'Épargne',
      clientName: 'Marie Dupont',
      montant: 15000,
      date: new Date(2023, 3, 1, 10, 30),
      category: 'Épargne',
      isIncome: true,
      icon: 'arrow-down-circle',
    },
    {
      id: 2,
      type: 'Retrait',
      clientName: 'Jean Martin',
      montant: 8000,
      date: new Date(2023, 3, 1, 9, 15),
      category: 'Retrait',
      isIncome: false,
      icon: 'arrow-up-circle',
    },
    {
      id: 3,
      type: 'Épargne',
      clientName: 'Sophie Dubois',
      montant: 12500,
      date: new Date(2023, 3, 2, 16, 45),
      category: 'Épargne',
      isIncome: true,
      icon: 'arrow-down-circle',
    },
    {
      id: 4,
      type: 'Épargne',
      clientName: 'Michel Bernard',
      montant: 5000,
      date: new Date(2023, 3, 2, 14, 20),
      category: 'Épargne',
      isIncome: true,
      icon: 'arrow-down-circle',
    },
  ];
  
  export const mockClients = [
    {
      id: 1,
      nom: 'Dupont',
      prenom: 'Marie',
      numeroCni: 'CM12345678',
      numeroCompte: '37305D0100015254',
      telephone: '+237 655 123 456',
      solde: 124500.0,
      status: 'active',
    },
    {
      id: 2,
      nom: 'Martin',
      prenom: 'Jean',
      numeroCni: 'CM23456789',
      numeroCompte: '37305D0100015255',
      telephone: '+237 677 234 567',
      solde: 56700.0,
      status: 'active',
    },
    {
      id: 3,
      nom: 'Dubois',
      prenom: 'Sophie',
      numeroCni: 'CM34567890',
      numeroCompte: '37305D0100015256',
      telephone: '+237 698 345 678',
      solde: 83200.0,
      status: 'inactive',
    },
    {
      id: 4,
      nom: 'Bernard',
      prenom: 'Michel',
      numeroCni: 'CM45678901',
      numeroCompte: '37305D0100015257',
      telephone: '+237 651 456 789',
      solde: 42100.0,
      status: 'active',
    },
  ];
  
  export const mockCollecteurs = [
    {
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      adresseMail: 'jean.dupont@example.com',
      telephone: '+237 655 123 456',
      agence: {
        id: 1,
        nomAgence: 'Agence Centrale'
      },
      montantMaxRetrait: 150000,
      status: 'active',
      totalClients: 45,
    },
    {
      id: 2,
      nom: 'Martin',
      prenom: 'Sophie',
      adresseMail: 'sophie.martin@example.com',
      telephone: '+237 677 234 567',
      agence: {
        id: 1,
        nomAgence: 'Agence Centrale'
      },
      montantMaxRetrait: 150000,
      status: 'active',
      totalClients: 32,
    },
    {
      id: 3,
      nom: 'Dubois',
      prenom: 'Pierre',
      adresseMail: 'pierre.dubois@example.com',
      telephone: '+237 698 345 678',
      agence: {
        id: 2,
        nomAgence: 'Agence Nord'
      },
      montantMaxRetrait: 100000,
      status: 'inactive',
      totalClients: 0,
    },
  ];
  
  // Configuration pour activer/désactiver le mode mock
  export const MOCK_ENABLED = true; // Mettre à false pour utiliser l'API réelle