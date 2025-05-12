import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importation des navigateurs
import BottomTabNavigator from './BottomTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

// Importation des écrans communs
import SettingsScreen from '../screens/Common/SettingsScreen';
import NotificationsScreen from '../screens/Common/NotificationsScreen';
import ClientDetailScreen from '../screens/Collecteur/ClientDetailScreen';
import CollecteDetailScreen from '../screens/Collecteur/CollecteDetailScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  // Dans une implémentation réelle, cette variable serait déterminée en fonction du rôle de l'utilisateur
  const userRole = 'collecteur'; // ou 'admin'

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Navigation principale en fonction du rôle */}
      <Stack.Screen 
        name="Main" 
        component={userRole === 'admin' ? AdminTabNavigator : BottomTabNavigator} 
      />
      
      {/* Écrans communs */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      
      {/* Écrans du collecteur */}
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <Stack.Screen name="CollecteDetail" component={CollecteDetailScreen} />
      
      {/* Ici, vous pouvez ajouter d'autres écrans spécifiques au rôle admin si nécessaire */}
    </Stack.Navigator>
  );
};

export default AppNavigator;