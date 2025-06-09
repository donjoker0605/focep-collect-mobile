import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import theme from '../../theme';

const SecurityPinScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timerCount, setTimerCount] = useState(60);

  // Simuler le décompte du temps pour renvoyer le code
  useEffect(() => {
    let interval = null;
    if (timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount(prevTimer => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [timerCount]);

  const handlePinInput = (value) => {
    // Trouver le premier emplacement vide dans le tableau de PIN
    const emptyIndex = pin.findIndex(digit => digit === '');
    
    if (emptyIndex !== -1) {
      const newPin = [...pin];
      newPin[emptyIndex] = value;
      setPin(newPin);
      
      // Si c'est le dernier chiffre, valider le code
      if (emptyIndex === pin.length - 1) {
        setTimeout(() => {
          validatePin(newPin.join(''));
        }, 300);
      }
    }
  };

  const handleDeletePin = () => {
    // Trouver le dernier emplacement non-vide
    const lastFilledIndex = pin.map(digit => digit !== '').lastIndexOf(true);
    
    if (lastFilledIndex !== -1) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = '';
      setPin(newPin);
    }
  };

  const validatePin = (pinCode) => {
    setLoading(true);
    // Simuler la validation du code PIN (remplacer par un appel API dans une vraie application)
    setTimeout(() => {
      setLoading(false);
      // Pour cette démo, nous considérons que "273916" est un code valide
      if (pinCode === '273916') {
        navigation.navigate('NewPassword', { email: email });
      } else {
        setError('Code PIN invalide. Veuillez réessayer.');
        setPin(['', '', '', '', '', '']);
      }
    }, 1500);
  };

  const handleResendCode = () => {
    // Réinitialiser le timer
    setTimerCount(60);
    // Simuler l'envoi d'un nouveau code (remplacer par un appel API dans une vraie application)
    console.log('Resending code to:', email);
    // Afficher une notification à l'utilisateur
    setError('Un nouveau code a été envoyé à votre adresse email.');
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Pin</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Enter Security Pin</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.pinContainer}>
            {pin.map((digit, index) => (
              <View 
                key={index} 
                style={[
                  styles.pinCircle,
                  digit ? styles.pinCircleFilled : {}
                ]}
              >
                <Text style={styles.pinDigit}>{digit}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.keypadContainer}>
            <View style={styles.keypadRow}>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('1')}
              >
                <Text style={styles.keypadButtonText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('2')}
              >
                <Text style={styles.keypadButtonText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('3')}
              >
                <Text style={styles.keypadButtonText}>3</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.keypadRow}>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('4')}
              >
                <Text style={styles.keypadButtonText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('5')}
              >
                <Text style={styles.keypadButtonText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('6')}
              >
                <Text style={styles.keypadButtonText}>6</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.keypadRow}>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('7')}
              >
                <Text style={styles.keypadButtonText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('8')}
              >
                <Text style={styles.keypadButtonText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('9')}
              >
                <Text style={styles.keypadButtonText}>9</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.keypadRow}>
              <View style={styles.emptyKeypadButton} />
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => handlePinInput('0')}
              >
                <Text style={styles.keypadButtonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={handleDeletePin}
              >
                <Ionicons name="backspace-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => validatePin(pin.join(''))}
            disabled={pin.includes('') || loading}
          >
            <Text style={styles.acceptButtonText}>
              {loading ? 'Vérification...' : 'Accept'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              timerCount > 0 ? styles.resendButtonDisabled : {}
            ]}
            onPress={handleResendCode}
            disabled={timerCount > 0}
          >
            <Text style={styles.resendButtonText}>
              {timerCount > 0 
                ? `Send Again (${timerCount}s)` 
                : 'Send Again'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.accountContainer}>
            <Text style={styles.accountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default SecurityPinScreen;
