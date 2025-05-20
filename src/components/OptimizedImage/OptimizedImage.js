// src/components/OptimizedImage/OptimizedImage.js
import React, { useState, useEffect } from 'react';
import { Image, ActivityIndicator, View, StyleSheet } from 'react-native';
import imageCacheService from '../../services/imageCache';
import theme from '../../theme';

const OptimizedImage = ({
  source,
  style,
  placeholderColor = theme.colors.lightGray,
  showLoader = true,
  resizeMode = 'cover',
  ...props
}) => {
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      // Réinitialiser l'état
      if (isMounted) {
        setLoading(true);
        setError(false);
      }
      
      try {
        // Traiter différents types de sources
        if (!source) {
          throw new Error('Source d\'image non spécifiée');
        }
        
        // Si la source est un objet avec uri
        if (typeof source === 'object' && source.uri) {
          const cachedPath = await imageCacheService.getCachedImage(source.uri);
          
          if (isMounted) {
            if (cachedPath) {
              setImageSource({ uri: cachedPath });
            } else {
              setImageSource(source);
            }
          }
        } 
        // Si la source est un module local (require)
        else if (typeof source === 'number') {
          if (isMounted) {
            setImageSource(source);
          }
        }
        // Si la source est une URL directe (string)
        else if (typeof source === 'string') {
          const cachedPath = await imageCacheService.getCachedImage(source);
          
          if (isMounted) {
            setImageSource({ uri: cachedPath || source });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur lors du chargement de l\'image:', err);
          setError(true);
          // En cas d'erreur, utiliser la source originale
          if (typeof source === 'string') {
            setImageSource({ uri: source });
          } else {
            setImageSource(source);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [source]);
  
  // Gérer le chargement de l'image
  const handleLoadStart = () => {
    setLoading(true);
  };
  
  const handleLoadEnd = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    setError(true);
    setLoading(false);
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Placeholder coloré */}
      {(loading || !imageSource) && (
        <View style={[styles.placeholder, { backgroundColor: placeholderColor }]} />
      )}
      
      {/* Indicateur de chargement */}
      {loading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
      
      {/* Image */}
      {imageSource && (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Image d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Image
            source={require('../../../assets/images/image-error.png')}
            style={styles.errorIcon}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
  },
  errorIcon: {
    width: '30%',
    height: '30%',
    opacity: 0.5,
  },
});

export default React.memo(OptimizedImage);