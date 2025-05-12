// src/components/Header/Header.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import theme from '../../theme';

const Header = ({
  title,
  showBackButton = true,
  rightComponent,
  color = theme.colors.primary,
  textColor = theme.colors.white,
  withShadow = false,
  onBackPress,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };
  
  const statusBarHeight = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight;
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: color },
      withShadow && styles.containerWithShadow
    ]}>
      <StatusBar
        backgroundColor={color}
        barStyle={textColor === theme.colors.white ? "light-content" : "dark-content"}
      />
      
      <View style={[styles.contentContainer, { marginTop: statusBarHeight }]}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        )}
        
        <Text style={[styles.title, { color: textColor }]}>
          {title}
        </Text>
        
        <View style={styles.rightContainer}>
          {rightComponent ? rightComponent : <View style={{ width: 24 }} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  containerWithShadow: {
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
    elevation: 4,
    zIndex: 10,
  },
  contentContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  rightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});

export default Header;