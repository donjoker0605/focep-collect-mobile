 // src/components/ProgressIndicator/ProgressIndicator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../theme';

const ProgressIndicator = ({
  progress = 0, // 0 to 1
  height = 10,
  width = '100%',
  backgroundColor = theme.colors.lightGray,
  progressColor = theme.colors.primary,
  showPercentage = true,
  percentagePosition = 'right', // 'right', 'left', 'top', 'bottom', 'inside'
  customLabel,
  labelStyle,
  style,
}) => {
  // S'assurer que la progression est entre 0 et 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Formater le pourcentage
  const percentage = `${Math.round(normalizedProgress * 100)}%`;
  
  // Déterminer le seuil pour le texte à l'intérieur
  const shouldShowTextInside = percentagePosition === 'inside' && normalizedProgress > 0.2;
  
  // Déterminer si la couleur du texte doit être claire ou foncée
  const textColor = shouldShowTextInside ? theme.colors.white : theme.colors.text;
  
  const renderPercentageLabel = () => {
    if (!showPercentage) return null;
    
    const label = customLabel || percentage;
    
    if (percentagePosition === 'inside') {
      return null; // Géré séparément
    }
    
    return (
      <Text style={[
        styles.percentageText,
        { color: theme.colors.text },
        percentagePosition === 'left' && styles.percentageLeft,
        percentagePosition === 'right' && styles.percentageRight,
        percentagePosition === 'top' && styles.percentageTop,
        percentagePosition === 'bottom' && styles.percentageBottom,
        labelStyle
      ]}>
        {label}
      </Text>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      {(showPercentage && percentagePosition === 'top') && renderPercentageLabel()}
      {(showPercentage && percentagePosition === 'left') && renderPercentageLabel()}
      
      <View style={[
        styles.track,
        {
          backgroundColor,
          height,
          width,
          borderRadius: height / 2
        }
      ]}>
        <View style={[
          styles.progress,
          {
            width: `${normalizedProgress * 100}%`,
            backgroundColor: progressColor,
            borderRadius: height / 2
          }
        ]}>
          {shouldShowTextInside && showPercentage && (
            <Text style={[styles.insideText, { color: textColor }]}>
              {customLabel || percentage}
            </Text>
          )}
        </View>
      </View>
      
      {(showPercentage && percentagePosition === 'right') && renderPercentageLabel()}
      {(showPercentage && percentagePosition === 'bottom') && renderPercentageLabel()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentageLeft: {
    position: 'absolute',
    left: -40,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  percentageRight: {
    position: 'absolute',
    right: -40,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  percentageTop: {
    marginBottom: 8,
  },
  percentageBottom: {
    marginTop: 8,
  },
  insideText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingRight: 8,
  },
});

export default ProgressIndicator;