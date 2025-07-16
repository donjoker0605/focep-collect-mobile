// src/components/index.js
// Export des composants pour faciliter l'importation

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
export { default as EnhancedTransactionItem } from './TransactionItem/EnhancedTransactionItem';
export { default as DataTable } from './DataTable/DataTable';
export { default as Chart } from './Chart/Chart';

// ========================================
// 📝 COMPOSANTS DE SAISIE
// ========================================
export { default as AmountInput } from './AmountInput/AmountInput';
export { default as DatePicker } from './DatePicker/DatePicker';
export { default as PinInput } from './PinInput/PinInput';
export { default as SelectInput } from './SelectInput/SelectInput';
export { default as SignatureInput } from './SignatureInput/SignatureInput';
export { default as FilterBar } from './FilterBar/FilterBar';

// ========================================
// 👥 COMPOSANTS CLIENT (NOUVEAUX)
// ========================================
export { default as ClientInput } from './ClientInput/ClientInput';
export { default as ClientList } from './ClientList/OptimizedClientList';

// ========================================
// 📱 COMPOSANTS DE NOTIFICATION ET STATUS
// ========================================
export { default as NotificationBadge } from './NotificationBadge/NotificationBadge';
export { default as ErrorNotification } from './ErrorNotification/ErrorNotification';
export { default as SyncStatusIndicator, SYNC_STATUS } from './SyncStatusIndicator/SyncStatusIndicator';
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
// 🔐 COMPOSANTS D'AUTHENTIFICATION
// ========================================
export { default as BiometricAuth } from './BiometricAuth/BiometricAuth';

// ========================================
// 📋 COMPOSANTS MÉTIER SPÉCIFIQUES
// ========================================
export { default as PrintableReceipt } from './PrintableReceipt/PrintableReceipt';
export { default as ReportGenerator } from './ReportGenerator/ReportGenerator';
export { default as ActivityLogItem } from './ActivityLogItem/ActivityLogItem';

// ========================================
// 🖼️ COMPOSANTS D'OPTIMISATION PERFORMANCE
// ========================================
export { default as OptimizedImage } from './OptimizedImage/OptimizedImage';
export { default as OptimizedList } from './OptimizedList/OptimizedList';

// ========================================
// 🎀 WRAPPER D'APPLICATION
// ========================================
export { default as AppWrapper } from './AppWrapper';

// ========================================
// 🚧 COMPOSANTS EN DÉVELOPPEMENT
// ========================================
// Note: Les composants Commission sont commentés temporairement pour éviter les cycles de dépendances
// Une fois le problème de cycle résolu, vous pourrez les réactiver

// export { default as CommissionParametersForm } from './Commission/CommissionParametersForm';
// export { default as CommissionVisualization } from './Commission/CommissionVisualization';
