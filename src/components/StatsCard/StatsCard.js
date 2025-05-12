// src/components/StatsCard/StatsCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card/Card';
import theme from '../../theme';

const StatsCard = ({
  title,
  value,
  unit,
  icon,
  iconColor = theme.colors.primary,
  iconBackgroundColor,
  showPercentChange = false,
  percentChange = 0,
  compareLabel = 'vs période précédente',
  onPress,
  variant = 'default', // default, horizontal, minimal
  style,
}) => {
  // Formater le pourcentage de changement
  const formatPercentChange = (percent) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };
  
  // Déterminer la couleur pour le pourcentage (positive ou négative)
  const getPercentColor = (percent) => {
    if (percent > 0) return theme.colors.success;
    if (percent < 0) return theme.colors.error;
    return theme.colors.textLight;
  };
  
  // Déterminer l'icône pour le pourcentage (up, down, ou none)
  const getPercentIcon = (percent) => {
    if (percent > 0) return 'arrow-up';
    if (percent < 0) return 'arrow-down';
    return 'remove';
  };
  
  const renderContent = () => {
    switch (variant) {
      case 'horizontal':
        return (
          <View style={styles.horizontalLayout}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: iconBackgroundColor || `${iconColor}20` }
            ]}>
              <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={styles.horizontalTextContainer}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{value}</Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
              </View>
              {showPercentChange && (
                <View style={styles.percentChangeContainer}>
                  <Ionicons
                    name={getPercentIcon(percentChange)}
                    size={12}
                    color={getPercentColor(percentChange)}
                    style={styles.percentIcon}
                  />
                  <Text style={[styles.percentChange, { color: getPercentColor(percentChange) }]}>
                    {formatPercentChange(percentChange)}
                  </Text>
                  <Text style={styles.compareLabel}>{compareLabel}</Text>
                </View>
              )}
            </View>
          </View>
        );
        
      case 'minimal':
        return (
          <View style={styles.minimalLayout}>
            <View style={styles.minimalHeader}>
              <Text style={styles.minimalTitle}>{title}</Text>
              <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <View style={styles.minimalValueContainer}>
              <Text style={styles.minimalValue}>{value}</Text>
              {unit && <Text style={styles.minimalUnit}>{unit}</Text>}
            </View>
            {showPercentChange && (
              <View style={styles.minimalPercentContainer}>
                <Ionicons
                  name={getPercentIcon(percentChange)}
                  size={10}
                  color={getPercentColor(percentChange)}
                />
                <Text style={[styles.minimalPercent, { color: getPercentColor(percentChange) }]}>
                  {formatPercentChange(percentChange)}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'default':
      default:
        return (
          <View style={styles.defaultLayout}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <View style={[
                styles.iconContainer,
                { backgroundColor: iconBackgroundColor || `${iconColor}20` }
              ]}>
                <Ionicons name={icon} size={20} color={iconColor} />
              </View>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{value}</Text>
              {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
            {showPercentChange && (
              <View style={styles.percentChangeContainer}>
                <Ionicons
                  name={getPercentIcon(percentChange)}
                  size={12}
                  color={getPercentColor(percentChange)}
                  style={styles.percentIcon}
                />
                <Text style={[styles.percentChange, { color: getPercentColor(percentChange) }]}>
                  {formatPercentChange(percentChange)}
                </Text>
                <Text style={styles.compareLabel}>{compareLabel}</Text>
              </View>
            )}
          </View>
        );
    }
  };
  
  return (
    <Card 
      style={[styles.container, style]} 
      onPress={onPress}
      elevation={1}
    >
      {renderContent()}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 10,
  },
  // Styles pour le layout par défaut (vertical)
  defaultLayout: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 4,
  },
  unit: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  percentChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentIcon: {
    marginRight: 4,
  },
  percentChange: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  compareLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
  },
  
  // Styles pour le layout horizontal
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  
  // Styles pour le layout minimal
  minimalLayout: {
    padding: 4,
  },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  minimalTitle: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  minimalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  minimalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 4,
  },
  minimalUnit: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  minimalPercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalPercent: {
    fontSize: 10,
    marginLeft: 2,
  },
});

export default StatsCard;