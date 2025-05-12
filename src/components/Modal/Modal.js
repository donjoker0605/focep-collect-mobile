// src/components/Modal/Modal.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const { width, height } = Dimensions.get('window');

const Modal = ({
  isVisible = false,
  title,
  children,
  onClose,
  footer,
  size = 'medium', // small, medium, large, full
  position = 'center', // center, bottom, top
  backdropOpacity = 0.5,
  showCloseButton = true,
  closeOnBackdropPress = true,
  contentContainerStyle,
  headerStyle,
  footerStyle,
  titleStyle,
  animationType = 'slide',
  scrollable = true,
  fullscreenOnSmallDevices = true,
}) => {
  // Déterminer si nous sommes sur un petit appareil
  const isSmallDevice = width < 375;
  
  // Ajuster la taille en fonction de l'appareil
  let modalWidth;
  let modalMaxHeight;
  
  if (fullscreenOnSmallDevices && isSmallDevice) {
    modalWidth = '100%';
    modalMaxHeight = '100%';
  } else {
    switch (size) {
      case 'small':
        modalWidth = width * 0.7;
        modalMaxHeight = height * 0.4;
        break;
      case 'large':
        modalWidth = width * 0.9;
        modalMaxHeight = height * 0.8;
        break;
      case 'full':
        modalWidth = '100%';
        modalMaxHeight = '100%';
        break;
      case 'medium':
      default:
        modalWidth = width * 0.85;
        modalMaxHeight = height * 0.6;
        break;
    }
  }
  
  // Déterminer la position
  let modalPosition;
  switch (position) {
    case 'top':
      modalPosition = { justifyContent: 'flex-start', paddingTop: 50 };
      break;
    case 'bottom':
      modalPosition = { justifyContent: 'flex-end', paddingBottom: 50 };
      break;
    case 'center':
    default:
      modalPosition = { justifyContent: 'center' };
      break;
  }
  
  const handleBackdropPress = () => {
    if (closeOnBackdropPress && onClose) {
      onClose();
    }
  };
  
  return (
    <RNModal
      visible={isVisible}
      transparent={true}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={[
        styles.backdrop,
        { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` },
        modalPosition,
      ]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.modalContainer,
          { width: modalWidth },
          size === 'full' && styles.fullSizeModal,
          contentContainerStyle,
        ]}>
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={[styles.header, headerStyle]}>
              <Text style={[styles.title, titleStyle]}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Body */}
          {scrollable ? (
            <ScrollView 
              style={[styles.body, { maxHeight: modalMaxHeight }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.body, { maxHeight: modalMaxHeight }]}>
              {children}
            </View>
          )}
          
          {/* Footer */}
          {footer && (
            <View style={[styles.footer, footerStyle]}>
              {footer}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  fullSizeModal: {
    flex: 1,
    marginVertical: 0,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
});

export default Modal;