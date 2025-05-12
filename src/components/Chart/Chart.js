// src/components/Chart/Chart.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
} from 'react-native-chart-kit';
import theme from '../../theme';

const { width } = Dimensions.get('window');

const Chart = ({
  type = 'line', // line, bar, pie, progress, contribution, stackedBar
  data,
  width: chartWidth = width - 32,
  height = 220,
  title,
  subtitle,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  style,
  withLegend = true,
  withLabels = true,
  yAxisSuffix = '',
  yAxisPrefix = '',
  yAxisInterval = 1,
  xAxisLabel = '',
  onDataPointClick,
  chartConfig = {},
  // Props spécifiques pour les graphiques en barres empilées
  stackedBarColors,
  // Props spécifiques pour les graphiques de type contribution
  contributionDates = [],
  contributionEndDate,
  contributionNumDays,
  // Props spécifiques pour les graphiques circulaires
  pieRadius,
  // Props spécifiques pour les graphiques de progression
  progressRingSize = 32,
  progressStrokeWidth = 16,
  progressRingColor = theme.colors.primary,
}) => {
  // Vérifier si des données sont disponibles
  const hasData = () => {
    if (!data) return false;
    
    switch (type) {
      case 'line':
      case 'bar':
        return data.labels && data.labels.length > 0 && 
               data.datasets && data.datasets.length > 0 && 
               data.datasets[0].data && data.datasets[0].data.length > 0;
      case 'pie':
        return data && data.length > 0;
      case 'progress':
        return data && data.data && data.data.length > 0;
      case 'contribution':
        return contributionDates && contributionDates.length > 0;
      case 'stackedBar':
        return data.labels && data.labels.length > 0 && 
               data.data && data.data.length > 0;
      default:
        return false;
    }
  };
  
  // Configuration par défaut du graphique
  const defaultChartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: theme.colors.white,
    backgroundGradientTo: theme.colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primaryRGB}, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForLabels: {
      fontSize: 12,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: theme.colors.lightGray,
    },
  };
  
  // Fusionner la configuration par défaut avec la configuration personnalisée
  const mergedChartConfig = {
    ...defaultChartConfig,
    ...chartConfig,
  };
  
  // Gérer le rendu pendant le chargement
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }
  
  // Gérer le rendu lorsqu'il n'y a pas de données
  if (!hasData()) {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }
  
  // Rendu en fonction du type de graphique
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={mergedChartConfig}
            bezier
            yAxisSuffix={yAxisSuffix}
            yAxisInterval={yAxisInterval}
            fromZero
            withInnerLines={true}
            withOuterLines={true}
            withHorizontalLines={true}
            withVerticalLines={false}
            withDots={true}
            withShadow={false}
            withScrollableDot={false}
            onDataPointClick={onDataPointClick}
            style={styles.chart}
            hidePointsAtIndex={[]}
            formatYLabel={(value) => yAxisPrefix + value + yAxisSuffix}
            xAxisLabel={xAxisLabel}
          />
        );
      
      case 'bar':
        return (
          <BarChart
            data={data}
            width={chartWidth}
            height={height}
            yAxisSuffix={yAxisSuffix}
            yAxisInterval={yAxisInterval}
            chartConfig={mergedChartConfig}
            style={styles.chart}
            withInnerLines={true}
            fromZero
            showBarTops={true}
            showValuesOnTopOfBars={false}
            withHorizontalLabels={withLabels}
            withVerticalLabels={withLabels}
            formatYLabel={(value) => yAxisPrefix + value + yAxisSuffix}
            xAxisLabel={xAxisLabel}
          />
        );
      
      case 'pie':
        return (
          <PieChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={mergedChartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={withLegend}
            center={[pieRadius || chartWidth / 4, 0]}
            avoidFalseZero
          />
        );
      
      case 'progress':
        return (
          <ProgressChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={{
              ...mergedChartConfig,
              color: (opacity = 1) => progressRingColor,
            }}
            strokeWidth={progressStrokeWidth}
            radius={progressRingSize}
            hideLegend={!withLegend}
          />
        );
      
      case 'contribution':
        return (
          <ContributionGraph
            values={contributionDates}
            endDate={contributionEndDate}
            numDays={contributionNumDays}
            width={chartWidth}
            height={height}
            chartConfig={mergedChartConfig}
            style={styles.chart}
            tooltipDataAttrs={({ date, count }) => ({
              'data-tip': `${count} activités le ${date}`,
            })}
            showOutOfRangeDays={false}
          />
        );
      
      case 'stackedBar':
        return (
          <StackedBarChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={{
              ...mergedChartConfig,
              color: (opacity = 1, index) => {
                if (stackedBarColors && index < stackedBarColors.length) {
                  return stackedBarColors[index];
                }
                return `rgba(${theme.colors.primaryRGB}, ${opacity})`;
              },
            }}
            style={styles.chart}
            withHorizontalLabels={withLabels}
            withVerticalLabels={withLabels}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.small,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default Chart;