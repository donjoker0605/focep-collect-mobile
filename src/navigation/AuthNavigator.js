import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

// Importation des écrans d'authentification
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import SecurityPinScreen from '../screens/Auth/SecurityPinScreen';
import NewPasswordScreen from '../screens/Auth/NewPasswordScreen';

const AuthNavigator = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="register" component={RegisterScreen} />
      <Stack.Screen name="forgot-password" component={ForgotPasswordScreen} />
      <Stack.Screen name="security-pin" component={SecurityPinScreen} />
      <Stack.Screen name="new-password" component={NewPasswordScreen} />
    </Stack>
  );
};

export default AuthNavigator;