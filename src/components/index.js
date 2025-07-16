// src/components/index.js
// Export des composants pour faciliter l'importation

// Composants de base
export { default as Alert } from './Alert/Alert';
export { default as BalanceCard } from './BalanceCard/BalanceCard';
export { default as Button } from './Button/Button';
export { default as Card } from './Card/Card';
export { default as EmptyState } from './EmptyState/EmptyState';
export { default as Header } from './Header/Header';
export { default as Input } from './Input/Input';
export { default as ProgressIndicator } from './ProgressIndicator/ProgressIndicator';
export { default as SelectInput } from './SelectInput/SelectInput';
export { default as StatsCard } from './StatsCard/StatsCard';
export { default as TransactionItem } from './TransactionItem/TransactionItem';
export { default as EnhancedTransactionItem } from './TransactionItem/EnhancedTransactionItem';

// Composants pour les dates et la saisie
export { default as DatePicker } from './DatePicker/DatePicker';
export { default as AmountInput } from './AmountInput/AmountInput';
export { default as PinInput } from './PinInput/PinInput';
export { default as SignatureInput } from './SignatureInput/SignatureInput';

// Composants pour les données et visualisations
export { default as DataTable } from './DataTable/DataTable';
export { default as Chart } from './Chart/Chart';
export { default as FilterBar } from './FilterBar/FilterBar';

// Composants pour le dialogue et notifications
export { default as Modal } from './Modal/Modal';
export { default as NotificationBadge } from './NotificationBadge/NotificationBadge';

// Composants pour l'upload et le transfert de fichiers
export { default as FileUpload } from './FileUpload/FileUpload';

// Composants de navigation
export { default as TabView } from './TabView/TabView';

// Composants métier spécifiques
export { default as PrintableReceipt } from './PrintableReceipt/PrintableReceipt';

// Composants de statut et de connexion
export { default as SyncStatusIndicator, SYNC_STATUS } from './SyncStatusIndicator/SyncStatusIndicator';
export { default as OfflineIndicator } from './OfflineIndicator/OfflineIndicator';

// Composants d'authentification et de sécurité
export { default as BiometricAuth } from './BiometricAuth/BiometricAuth';

// Composants de rapport
export { default as ReportGenerator } from './ReportGenerator/ReportGenerator';

// Wrapper d'application
export { default as AppWrapper } from './AppWrapper';

export { default as ClientInput } from './ClientInput';

// Note: Les composants Commission sont commentés temporairement pour éviter les cycles de dépendances
// Une fois le problème de cycle résolu, vous pourrez les réactiver

// export { default as CommissionParametersForm } from './Commission/CommissionParametersForm';
// export { default as CommissionVisualization } from './Commission/CommissionVisualization';