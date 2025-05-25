// src/services/index.js
export { default as authService } from './authService';
export { default as journalService } from './journalService';
export { default as collecteurService } from './collecteurService';
export { default as clientService } from './clientService';
export { default as transactionService } from './transactionService';
export { default as compteService } from './compteService';
export { default as transferService } from './transferService';
export { default as mouvementService } from './mouvementService';
export { default as testService } from './testService';

// CORRECTION : Créer un vrai notificationService dans services/
// au lieu d'importer depuis api/
export { default as notificationService } from './notificationService';