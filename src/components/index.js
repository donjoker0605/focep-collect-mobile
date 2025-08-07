// src/components/index.js - VERSION REFACTORISÉE SANS CYCLES
// ⚠️ RÈGLE CRITIQUE : Ce fichier ne doit JAMAIS être importé par les composants qu'il exporte
// Utilisé UNIQUEMENT par les screens et services externes

// ========================================
// 🔤 COMPOSANTS DE BASE
// ========================================
export { default as Alert } from './Alert/Alert';
export { default as Button } from './Button/Button';
export { default as Card } from './Card/Card';
export { default as EmptyState } from './EmptyState/EmptyState';
export { default as Header } from './Header/Header';
export { default as Input } from './Input/Input';
export { default as Modal } from './Modal/Modal';
export { default as ProgressIndicator } from './ProgressIndicator/ProgressIndicator';

// ========================================
// 📊 COMPOSANTS D'AFFICHAGE DE DONNÉES
// ========================================
export { default as BalanceCard } from './BalanceCard/BalanceCard';
export { default as StatsCard } from './StatsCard/StatsCard';
export { default as TransactionItem } from './TransactionItem/TransactionItem';
export { default as DataTable } from './DataTable/DataTable';
export { default as Chart } from './Chart/Chart';

// ========================================
// 📝 COMPOSANTS DE SAISIE
// ========================================
export { default as AmountInput } from './AmountInput/AmountInput';
export { default as DatePicker } from './DatePicker/DatePicker';
export { default as DateSelector } from './DateSelector/DateSelector';
export { default as PinInput } from './PinInput/PinInput';
export { default as SelectInput } from './SelectInput/SelectInput';
export { default as SignatureInput } from './SignatureInput/SignatureInput';
export { default as FilterBar } from './FilterBar/FilterBar';

// ========================================
// 👥 COMPOSANTS CLIENT ET COLLECTEUR
// ========================================
export { default as ClientInput } from './ClientInput/ClientInput';
export { default as OptimizedClientList } from './ClientList/OptimizedClientList';
export { default as CollecteurSelector } from './CollecteurSelector/CollecteurSelector';

// ========================================
// 📱 COMPOSANTS DE NOTIFICATION ET STATUS
// ========================================
export { default as NotificationBadge } from './NotificationBadge/NotificationBadge';
export { default as ErrorNotification } from './ErrorNotification/ErrorNotification';
export { default as SyncStatusIndicator } from './SyncStatusIndicator/SyncStatusIndicator';
export { default as OfflineIndicator } from './OfflineIndicator/OfflineIndicator';

// ========================================
// 🎯 COMPOSANTS MODALS ET OVERLAYS  
// ========================================
export { default as PhoneVerificationModal } from './PhoneVerificationModal/PhoneVerificationModal';

// ========================================
// 📂 COMPOSANTS D'UPLOAD ET TRANSFERT
// ========================================
export { default as FileUpload } from './FileUpload/FileUpload';

// ========================================
// 🧭 COMPOSANTS DE NAVIGATION
// ========================================
export { default as TabView } from './TabView/TabView';

// ========================================
// 📄 COMPOSANTS D'ACTIVITÉ ET LOGS
// ========================================
export { default as ActivityLogItem } from './ActivityLogItem/ActivityLogItem';

// ========================================
// 🎨 COMPOSANTS DE PERFORMANCE
// ========================================
export { default as OptimizedImage } from './OptimizedImage/OptimizedImage';
export { default as OptimizedList } from './OptimizedList/OptimizedList';

// ========================================
// 🌐 COMPOSANTS RÉSEAU ET SYNC
// ========================================
export { default as SyncIndicator } from './SyncIndicator';

// ========================================
// 🔒 COMPOSANTS DE SÉCURITÉ
// ========================================
export { default as BiometricAuth } from './BiometricAuth/BiometricAuth';

// ========================================
// 📋 COMPOSANTS DE FORMULAIRE AVANCÉS
// ========================================
export { default as RoleSwitcher } from './RoleSwitcher/RoleSwitcher';

// ========================================
// 🎛️ COMPOSANTS DE CONTRÔLE
// ========================================
export { default as CommissionParametersForm } from './Commission/Commission/CommissionParametersForm';
export { default as CommissionVisualization } from './Commission/CommissionVisualization';
export { default as PrintableReceipt } from './PrintableReceipt/PrintableReceipt';
export { default as ReportGenerator } from './ReportGenerator/ReportGenerator';