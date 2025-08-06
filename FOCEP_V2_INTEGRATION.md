# FOCEP v2 - Intégration Mobile Complète

## 📱 Vue d'ensemble

Cette documentation couvre l'intégration complète des nouvelles fonctionnalités FOCEP v2 dans l'application mobile React Native. L'implémentation suit l'architecture existante et ajoute des capacités avancées de calcul de commission et de gestion de rémunération.

## 🏗️ Architecture Implémentée

### Structure des Dossiers
```
src/
├── api/
│   └── commissionV2.js          # Appels API FOCEP v2
├── hooks/
│   └── useCommissionV2.js       # Hook de gestion d'état
├── services/
│   └── commissionV2Service.js   # Logique métier
├── screens/Admin/
│   ├── CommissionCalculationV2Screen.js     # Écran principal
│   └── RubriqueRemunerationScreen.js        # Gestion rubriques
├── components/RubriqueRemuneration/
│   └── RubriqueRemunerationForm.js          # Formulaire rubriques
├── utils/
│   ├── fileDownloader.js        # Téléchargement Excel
│   ├── formatters.js           # Formatage données
│   └── testCommissionV2.js     # Tests intégration
└── tests/
    └── focepV2Integration.test.js           # Tests unitaires
```

## 🔧 Fonctionnalités Implémentées

### 1. Calcul de Commission Hiérarchique
- **Hiérarchie**: Client → Collecteur → Agence
- **Types de commission**: Fixe, Pourcentage, Paliers
- **TVA automatique**: 19,25% appliquée automatiquement
- **Validation**: Paramètres de période et collecteur

#### API Endpoints
```javascript
// Calcul commission uniquement
POST /api/v2/commission-remuneration/collecteur/{id}/calculer

// Processus complet (commission + rémunération)  
POST /api/v2/commission-remuneration/collecteur/{id}/processus-complet
```

### 2. Système de Rémunération Vi vs S
- **S (Montant commission)**: Somme des commissions calculées
- **Vi (Rubriques variables)**: Rubriques configurables par collecteur
- **Montant EMF**: Surplus calculé automatiquement
- **Mouvements comptables**: Générés automatiquement

### 3. Gestion des Rubriques de Rémunération
- **Types**: Montant fixe (CONSTANT) ou Pourcentage (PERCENTAGE)
- **Paramètres configurables**:
  - Nom et type de rubrique
  - Valeur (montant ou pourcentage)
  - Date d'application
  - Délai en jours (optionnel)
  - Collecteurs concernés
  - Statut actif/inactif

#### Interface Utilisateur
```javascript
// Écran de gestion des rubriques
RubriqueRemunerationScreen
├── Sélection collecteur
├── Statistiques (total, actives, montants)
├── Liste des rubriques existantes
└── Formulaire création/modification

// Formulaire rubrique
RubriqueRemunerationForm
├── Informations de base (nom, type, valeur)
├── Configuration temporelle (date, délai)
├── Attribution collecteurs
└── Validation en temps réel
```

### 4. Génération et Téléchargement de Rapports Excel
- **Rapports disponibles**: Commission, Rémunération
- **Format**: Fichiers Excel (.xlsx) natifs
- **Contenu détaillé**: Données par client, totaux, calculs intermédiaires
- **Partage multi-plateforme**: iOS et Android

#### Implémentation Technique
```javascript
// Générateur de rapports
class FileDownloader {
  async downloadExcelFile(blob, fileName) {
    // Conversion Blob → Base64
    // Écriture fichier temporaire
    // Partage selon plateforme (iOS/Android)
    // Nettoyage automatique
  }
}

// Utilisation
const result = await generateCommissionReport(collecteurId, dateDebut, dateFin);
// → Fichier Excel partagé automatiquement
```

## 📋 Guide d'Utilisation

### Pour les Administrateurs

#### 1. Accès aux Nouvelles Fonctionnalités
1. Dashboard Admin → "Commission FOCEP v2" (badge NOUVEAU)
2. Dashboard Admin → "Rubriques Rémunération"

#### 2. Calcul de Commission
```
1. Sélectionner un collecteur
2. Définir la période (début/fin)
3. Choisir l'action:
   - "Calculer Commission Uniquement" : Calcul seul
   - "Processus Complet" : Commission + Rémunération
4. Consulter les résultats et statistiques
5. Télécharger le rapport Excel si nécessaire
```

#### 3. Gestion des Rubriques
```
1. Sélectionner un collecteur
2. Voir les rubriques existantes et statistiques
3. Créer/modifier une rubrique:
   - Nom descriptif
   - Type (Montant fixe ou Pourcentage)
   - Valeur selon le type
   - Date d'application
   - Délai (optionnel)
   - Attribution collecteurs
4. Activer/désactiver selon les besoins
```

## 🔌 Intégration Backend

### Endpoints Requis
```javascript
// Commission
POST /api/v2/commission-remuneration/collecteur/{id}/calculer
POST /api/v2/commission-remuneration/collecteur/{id}/processus-complet
POST /api/v2/commission-remuneration/collecteur/{id}/rapport-commission
POST /api/v2/commission-remuneration/collecteur/{id}/rapport-remuneration

// Rubriques
GET    /api/v2/rubriques-remuneration/collecteur/{id}
POST   /api/v2/rubriques-remuneration
PUT    /api/v2/rubriques-remuneration/{id}
DELETE /api/v2/rubriques-remuneration/{id}

// Statut
GET /api/v2/commission-remuneration/collecteur/{id}/statut
```

### Format des Données
```javascript
// Calcul commission - Response
{
  collecteurId: string,
  periode: { dateDebut: string, dateFin: string },
  commissionsClients: [
    {
      clientId: number,
      clientNom: string,
      montantEpargne: number,
      commissionX: number,
      tva: number,
      ancienSolde: number,
      nouveauSolde: number,
      parameterUsed: string
    }
  ],
  montantSCollecteur: number,
  totalTVA: number,
  success: boolean
}

// Rémunération - Response  
{
  collecteurId: string,
  montantSInitial: number,
  totalRubriqueVi: number,
  montantEMF: number,
  mouvements: Array,
  success: boolean
}
```

## 🧪 Tests et Validation

### Tests Automatisés
```bash
# Tests unitaires
npm test focepV2Integration.test.js

# Tests d'intégration (mode développement)
# → Utiliser le bouton test (🐛) dans l'écran Commission v2
```

### Tests Couverts
- ✅ Validation des paramètres
- ✅ Calculs statistiques
- ✅ Formatage des données
- ✅ Téléchargement de fichiers  
- ✅ Gestion d'erreurs
- ✅ Hooks React
- ✅ Services API
- ✅ Scénarios end-to-end

### Checklist de Validation
```
□ Backend FOCEP v2 déployé et accessible
□ Collecteurs configurés avec paramètres de commission
□ Clients avec données d'épargne disponibles
□ Permissions fichiers accordées (Android/iOS)
□ Tests d'intégration passés
□ Rapports Excel générés et consultables
□ Navigation entre écrans fonctionnelle
□ Gestion d'erreurs appropriée
```

## 🔒 Sécurité et Permissions

### Permissions Requises
```javascript
// Android
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

// iOS - Info.plist
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Sauvegarder les rapports Excel</string>
```

### Validation des Données
- Sanitisation des entrées utilisateur
- Validation côté client et serveur
- Gestion sécurisée des tokens d'authentification
- Chiffrement des données sensibles en transit

## 🚀 Déploiement et Mise en Production

### Prérequis
1. **Backend FOCEP v2** déployé et fonctionnel
2. **Expo packages** mis à jour (FileSystem, Sharing, MediaLibrary)
3. **Permissions** configurées selon les plateformes
4. **Tests d'intégration** validés

### Configuration Environnement
```javascript
// .env.production
EXPO_PUBLIC_API_BASE_URL=https://focep-api.prod.com
EXPO_PUBLIC_ENABLE_DEV_TOOLS=false

// .env.development  
EXPO_PUBLIC_API_BASE_URL=https://focep-api.dev.com
EXPO_PUBLIC_ENABLE_DEV_TOOLS=true
```

### Commandes de Build
```bash
# Android Production
npm run build:android:prod

# iOS Production
npm run build:ios:prod
```

## 📊 Monitoring et Logs

### Logs Applicatifs
```javascript
// Format des logs
console.log('🚀 Commission V2: Calcul hiérarchique', { collecteurId, dateDebut, dateFin });
console.log('💰 Rémunération V2: Processus Vi vs S', { montantS, totalVi });
console.log('📊 Génération rapport Excel', { fileName, size });
```

### Métriques Importantes
- Temps de calcul des commissions
- Taille des rapports générés  
- Erreurs de téléchargement
- Utilisation des rubriques
- Performance des API calls

## 🆘 Dépannage

### Problèmes Courants

#### 1. Erreur "Collecteur non trouvé"
```javascript
// Solution: Vérifier l'ID collecteur et la connectivité backend
const collecteurExists = await commissionV2Service.getCollecteurStatus(collecteurId);
```

#### 2. Téléchargement Excel échoue
```javascript
// Vérifier les permissions
const { status } = await MediaLibrary.requestPermissionsAsync();
// Nettoyer les fichiers temporaires
await fileDownloader.cleanupTempFiles();
```

#### 3. Calculs incorrects
```javascript
// Vérifier la configuration des paramètres de commission côté backend
// Utiliser le mode test pour valider les calculs
await testCommissionV2Integration(collecteurId);
```

## 📞 Support et Maintenance

### Contact Technique
- **Développeur**: Équipe React Native FOCEP
- **Backend**: Équipe API FOCEP v2
- **Tests**: Tests automatisés disponibles

### Maintenance Préventive
- Nettoyage automatique des fichiers temporaires (24h)
- Mise à jour des packages Expo
- Surveillance des performances API
- Backup des configurations de rubriques

---

## 🎯 Résumé Exécutif

L'intégration FOCEP v2 apporte des fonctionnalités avancées de calcul de commission et de gestion de rémunération à l'application mobile. L'implémentation respecte l'architecture existante, ajoute des capacités robustes de génération de rapports Excel, et fournit une interface intuitive pour la gestion des rubriques de rémunération.

**Points clés réalisés:**
- ✅ Architecture complète et testée
- ✅ Interface utilisateur intuitive  
- ✅ Génération de rapports Excel natifs
- ✅ Tests d'intégration complets
- ✅ Documentation technique détaillée
- ✅ Guide de déploiement et maintenance

L'application est prête pour la mise en production une fois le backend FOCEP v2 déployé et configuré.