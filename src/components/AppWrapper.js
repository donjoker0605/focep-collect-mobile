// src/components/AppWrapper.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useAuth } from '../hooks/useAuth';
import SyncStatusIndicator from './SyncStatusIndicator/SyncStatusIndicator';
import OfflineIndicator from './OfflineIndicator/OfflineIndicator';
import DevQuickLogin from './DevQuickLogin'; // Importez le composant

const AppWrapper = ({ children }) => {
  const { isOnline, syncStatus, pendingCount, syncNow } = useOfflineSync();
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.container}>
      
      {/* Indicateur de mode hors ligne */}
      <OfflineIndicator />
      
      {/* Contenu principal */}
      {children}
      
      {/* Indicateur de synchronisation */}
      {isAuthenticated && (
        <SyncStatusIndicator 
          position="bottom-right" 
          syncStatus={syncStatus}
          isOnline={isOnline}
          pendingCount={pendingCount}
          onPress={syncNow}
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




