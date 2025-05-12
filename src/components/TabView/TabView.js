// src/components/TabView/TabView.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const { width } = Dimensions.get('window');

const TabView = ({
  tabs = [],
  initialTab = 0,
  onTabChange,
  tabBarStyle,
  tabStyle,
  tabTextStyle,
  activeTabStyle,
  activeTabTextStyle,
  contentContainerStyle,
  showIcon = true,
  iconPosition = 'left', // left, right, top
  style,
  scrollEnabled = true,
  lazy = false,
  animated = true,
  swipeEnabled = true,
  tabBarPosition = 'top', // top, bottom
  containerHeight,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mounted, setMounted] = useState([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  // Monter l'onglet initial
  useEffect(() => {
    if (lazy) {
      setMounted(prev => [...prev, initialTab]);
    } else {
      setMounted([...Array(tabs.length).keys()]);
    }
  }, []);
  
  // Gestion du changement d'onglet
  const handleTabChange = (index) => {
    setActiveTab(index);
    
    // Ajouter l'onglet à la liste des onglets montés (pour le mode lazy)
    if (lazy && !mounted.includes(index)) {
      setMounted(prev => [...prev, index]);
    }
    
    // Faire défiler le contenu vers l'onglet sélectionné
    if (animated && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * width, animated: true });
    }
    
    // Callback
    if (onTabChange) {
      onTabChange(index);
    }
  };
  
  // Gestion du défilement (swipe) entre onglets
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );
  
  // Lorsque le défilement s'arrête, mettre à jour l'onglet actif
  const handleScrollEnd = (event) => {
    const position = event.nativeEvent.contentOffset.x;
    const index = Math.round(position / width);
    
    if (index !== activeTab) {
      setActiveTab(index);
      
      // Ajouter l'onglet à la liste des onglets montés (pour le mode lazy)
      if (lazy && !mounted.includes(index)) {
        setMounted(prev => [...prev, index]);
      }
      
      // Callback
      if (onTabChange) {
        onTabChange(index);
      }
    }
  };
  
  // Indicateur d'onglet animé
  const translateX = scrollX.interpolate({
    inputRange: tabs.map((_, i) => i * width),
    outputRange: tabs.map((_, i) => i * (width / tabs.length)),
    extrapolate: 'clamp',
  });
  
  // Rendu des onglets
  const renderTabs = () => (
    <View style={[styles.tabBar, tabBarStyle]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tab,
            iconPosition === 'top' && styles.tabVertical,
            tabStyle,
            activeTab === index && { ...styles.activeTab, ...activeTabStyle }
          ]}
          onPress={() => handleTabChange(index)}
          activeOpacity={0.7}
        >
          {showIcon && tab.icon && iconPosition === 'left' && (
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === index ? theme.colors.primary : theme.colors.gray}
              style={styles.tabIconLeft}
            />
          )}
          
          {showIcon && tab.icon && iconPosition === 'top' && (
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === index ? theme.colors.primary : theme.colors.gray}
              style={styles.tabIconTop}
            />
          )}
          
          <Text
            style={[
              styles.tabText,
              tabTextStyle,
              activeTab === index && { ...styles.activeTabText, ...activeTabTextStyle }
            ]}
            numberOfLines={1}
          >
            {tab.title}
          </Text>
          
          {showIcon && tab.icon && iconPosition === 'right' && (
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === index ? theme.colors.primary : theme.colors.gray}
              style={styles.tabIconRight}
            />
          )}
        </TouchableOpacity>
      ))}
      
      {animated && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: width / tabs.length,
              transform: [{ translateX }],
            }
          ]}
        />
      )}
    </View>
  );
  
  // Rendu du contenu des onglets
  const renderTabContent = () => (
    <Animated.ScrollView
      ref={scrollViewRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEnabled={swipeEnabled}
      onScroll={handleScroll}
      onMomentumScrollEnd={handleScrollEnd}
      scrollEventThrottle={16}
      style={[styles.contentContainer, contentContainerStyle]}
      contentContainerStyle={{ width: width * tabs.length }}
    >
      {tabs.map((tab, index) => (
        <View
          key={index}
          style={[
            styles.content,
            { width },
            containerHeight && { height: containerHeight },
          ]}
        >
          {(!lazy || mounted.includes(index)) && tab.content}
        </View>
      ))}
    </Animated.ScrollView>
  );
  
  return (
    <View style={[styles.container, style]}>
      {tabBarPosition === 'top' && renderTabs()}
      {renderTabContent()}
      {tabBarPosition === 'bottom' && renderTabs()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabVertical: {
    flexDirection: 'column',
  },
  tabIconLeft: {
    marginRight: 6,
  },
  tabIconRight: {
    marginLeft: 6,
  },
  tabIconTop: {
    marginBottom: 4,
  },
  activeTab: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default TabView;