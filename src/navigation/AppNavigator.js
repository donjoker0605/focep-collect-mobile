import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Stores
import { useAuthStore } from '../store/authStore';

// Écrans d'authentification
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Écrans collecteur
import { HomeCollecteurScreen } from '../screens/collecteur/HomeCollecteurScreen';
import { ClientsScreen } from '../screens/collecteur/ClientsScreen';
import { JournauxScreen } from '../screens/collecteur/JournauxScreen';
import { CollecteJournaliereScreen } from '../screens/collecteur/CollecteJournaliereScreen';
import { ProfilScreen } from '../screens/common/ProfilScreen';

// Écrans administrateur
import { HomeAdminScreen } from '../screens/admin/HomeAdminScreen';
import { GestionCollecteursScreen } from '../screens/admin/GestionCollecteursScreen';
import { ParametresScreen } from '../screens/admin/ParametresScreen';
import { RapportsScreen } from '../screens/admin/RapportsScreen';

// Theme
import { theme } from '../theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation pour les collecteurs
const CollecteurTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Accueil') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Clients') {
          iconName = focused ? 'account-group' : 'account-group-outline';
        } else if (route.name === 'Journaux') {
          iconName = focused ? 'book-open-page-variant' : 'book-open-page-variant-outline';
        } else if (route.name === 'Profil') {
          iconName = focused ? 'account' : 'account-outline';
        }

        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Accueil" component={HomeCollecteurScreen} />
    <Tab.Screen name="Clients" component={ClientsScreen} />
    <Tab.Screen name="Journaux" component={JournauxScreen} />
    <Tab.Screen name="Profil" component={ProfilScreen} />
  </Tab.Navigator>
);

// Navigation pour les administrateurs
const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'TableauDeBord') {
          iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        } else if (route.name === 'Collecteurs') {
          iconName = focused ? 'account-tie' : 'account-tie-outline';
        } else if (route.name === 'Paramètres') {
          iconName = focused ? 'cog' : 'cog-outline';
        } else if (route.name === 'Rapports') {
          iconName = focused ? 'chart-line' : 'chart-line-variant';
        } else if (route.name === 'Profil') {
          iconName = focused ? 'account' : 'account-outline';
        }

        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="TableauDeBord" component={HomeAdminScreen} />
    <Tab.Screen name="Collecteurs" component={GestionCollecteursScreen} />
    <Tab.Screen name="Paramètres" component={ParametresScreen} />
    <Tab.Screen name="Rapports" component={RapportsScreen} />
    <Tab.Screen name="Profil" component={ProfilScreen} />
  </Tab.Navigator>
);

// Stack principal pour l'application authentifiée
const AuthenticatedStack = () => {
  const { user } = useAuthStore();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN' ? (
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      ) : (
        <Stack.Screen name="CollecteurTabs" component={CollecteurTabs} />
      )}
      
      {/* Écrans communs */}
      <Stack.Screen name="CollecteJournaliere" component={CollecteJournaliereScreen} />
    </Stack.Navigator>
  );
};

// Stack pour l'authentification
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Composant principal de navigation
export const AppNavigator = () => {
  const { isAuthenticated, isLoading, checkAuthentication } = useAuthStore();

  useEffect(() => {
    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <AuthStack />}
    </NavigationContainer>
  );
};