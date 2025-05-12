// src/components/PinInput/PinInput.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const PinInput = ({
  value,
  onChange,
  length = 6,
  secure = true,
  autoFocus = true,
  error,
  style,
  keyboardType = 'numeric',
  textInputStyle,
  cellStyle,
  cellTextStyle,
  activeColor = theme.colors.primary,
  inactiveColor = theme.colors.lightGray,
  errorColor = theme.colors.error,
  filledColor = theme.colors.primary,
  cellSize = 50,
  cellSpacing = 8,
  showKeyboard = true,
  onComplete,
  caption,
  animateOnError = true,
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [secureText, setSecureText] = useState(secure);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animer les cellules en cas d'erreur
    if (error && animateOnError) {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ]).start();
    }
  }, [error, animateOnError]);
  
  // Focus sur l'input au montage si autoFocus est true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Vérifier si le code est complet
  useEffect(() => {
    if (value && value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);
  
  // Gérer le focus sur l'input
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  // Gérer la perte de focus
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // Afficher/masquer le texte saisi
  const toggleSecureText = () => {
    setSecureText(!secureText);
  };
  
  // Gérer le changement de la valeur
  const handleChangeText = (text) => {
    // Filtrer pour ne garder que les caractères autorisés (chiffres pour numeric)
    let filteredText = text;
    if (keyboardType === 'numeric') {
      filteredText = text.replace(/[^0-9]/g, '');
    }
    
    // Limiter la longueur à la valeur spécifiée
    if (filteredText.length <= length) {
      onChange(filteredText);
    }
  };
  
  // Focus sur l'input quand on touche le conteneur
  const handlePress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Créer un tableau de cellules basé sur la longueur
  const cells = [...Array(length)].map((_, index) => {
    const filled = index < value.length;
    const char = value[index];
    const isCurrentPosition = index === value.length;
    
    // Déterminer la couleur de bordure
    let borderColor = inactiveColor;
    if (error) {
      borderColor = errorColor;
    } else if (filled) {
      borderColor = filledColor;
    } else if (isFocused && isCurrentPosition) {
      borderColor = activeColor;
    }
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            borderColor,
            marginHorizontal: cellSpacing / 2,
            transform: [{ translateX: shakeAnimation }],
          },
          cellStyle,
        ]}
      >
        {filled && (
          <Text
            style={[
              styles.cellText,
              { fontSize: cellSize * 0.5 },
              cellTextStyle,
            ]}
          >
            {secureText ? '•' : char}
          </Text>
        )}
      </Animated.View>
    );
  });
  
  // Clavier personnalisé pour la saisie du PIN
  const renderKeyboard = () => {
    if (!showKeyboard) return null;
    
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace'],
    ];
    
    return (
      <View style={styles.keyboardContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keyButton} />;
              }
              
              if (key === 'backspace') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.keyButton}
                    onPress={() => {
                      handleChangeText(value.slice(0, -1));
                    }}
                  >
                    <Ionicons name="backspace" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                );
              }
              
              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.keyButton}
                  onPress={() => {
                    handleChangeText(value + key);
                  }}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.cellsContainer}
        onPress={handlePress}
        activeOpacity={1}
      >
        {cells}
      </TouchableOpacity>
      
      {/* Input invisible pour le focus et la saisie */}
      <TextInput
        ref={inputRef}
        style={[styles.hiddenInput, textInputStyle]}
        value={value}
        onChangeText={handleChangeText}
        keyboardType={keyboardType}
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureText}
        caretHidden={true}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {caption && !error && (
        <Text style={styles.caption}>{caption}</Text>
      )}
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleSecureText}
        >
          <Ionicons
            name={secureText ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={theme.colors.textLight}
          />
          <Text style={styles.toggleText}>
            {secureText ? 'Afficher' : 'Masquer'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => handleChangeText('')}
        >
          <Ionicons name="refresh-outline" size={20} color={theme.colors.textLight} />
          <Text style={styles.clearText}>Effacer</Text>
        </TouchableOpacity>
      </View>
      
      {renderKeyboard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  cell: {
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
  caption: {
    color: theme.colors.textLight,
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    color: theme.colors.textLight,
    marginLeft: 4,
    fontSize: 14,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearText: {
    color: theme.colors.textLight,
    marginLeft: 4,
    fontSize: 14,
  },
  keyboardContainer: {
    marginTop: 20,
    width: '100%',
    maxWidth: 300,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});

export default PinInput;