// src/components/AppWrapper.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useAuth } from '../hooks/useAuth';
import SyncStatusIndicator from './SyncStatusIndicator/SyncStatusIndicator';
import OfflineIndicator from './OfflineIndicator/OfflineIndicator';

const AppWrapper = ({ children }) => {
  const offlineSync = useOfflineSync();
  const { isAuthenticated } = useAuth();
  
  // Vérifier si les propriétés nécessaires existent
  const showSyncIndicator = isAuthenticated && 
                           offlineSync && 
                           typeof offlineSync.isOnline !== 'undefined';

  return (
    <View style={styles.container}>
      {/* Indicateur de mode hors ligne - rendu conditionnel */}
      {offlineSync && <OfflineIndicator />}
      
      {/* Contenu principal */}
      {children}
      
      {/* Indicateur de synchronisation - rendu conditionnel */}
      {showSyncIndicator && (
        <SyncStatusIndicator 
          position="bottom-right" 
          syncStatus={offlineSync.syncStatus}
          isOnline={offlineSync.isOnline}
          pendingCount={offlineSync.pendingCount}
          onPress={offlineSync.syncNow}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppWrapper;