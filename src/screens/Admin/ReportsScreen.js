// src/screens/Admin/ReportsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';

// Données fictives pour la démo
const months = [
  { id: 1, name: 'Janvier' },
  { id: 2, name: 'Février' },
  { id: 3, name: 'Mars' },
  { id: 4, name: 'Avril' },
  { id: 5, name: 'Mai' },
  { id: 6, name: 'Juin' },
  { id: 7, name: 'Juillet' },
  { id: 8, name: 'Août' },
  { id: 9, name: 'Septembre' },
  { id: 10, name: 'Octobre' },
  { id: 11, name: 'Novembre' },
  { id: 12, name: 'Décembre' },
];

const years = [2023, 2024, 2025];

const mockCollecteurs = [
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    agence: {
      id: 1,
      nomAgence: 'Agence Centrale'
    },
  },
  {
    id: 2,
    nom: 'Martin',
    prenom: 'Sophie',
    agence: {
      id: 1,
      nomAgence: 'Agence Centrale'
    },
  },
  {
    id: 3,
    nom: 'Dubois',
    prenom: 'Pierre',
    agence: {
      id: 2,
      nomAgence: 'Agence Nord'
    },
  },
];

const generateOptions = [
  { id: 'monthly', label: 'Rapport mensuel', icon: 'calendar-outline' },
  { id: 'commission', label: 'Rapport des commissions', icon: 'cash-outline' },
  { id: 'summary', label: 'Rapport de synthèse', icon: 'bar-chart-outline' },
];

const ReportsScreen = ({ navigation }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [showMonths, setShowMonths] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const [showCollecteurs, setShowCollecteurs] = useState(false);
  const [selectedReport, setSelectedReport] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = () => {
    setIsLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      setIsLoading(false);
      
      let reportType = '';
      switch (selectedReport) {
        case 'monthly':
          reportType = 'Rapport mensuel';
          break;
        case 'commission':
          reportType = 'Rapport des commissions';
          break;
        case 'summary':
          reportType = 'Rapport de synthèse';
          break;
      }
      
      Alert.alert(
        "Succès",
        `Le ${reportType} a été généré avec succès. Souhaitez-vous l'ouvrir maintenant ?`,
        [
          {
            text: "Non",
            style: "cancel",
          },
          {
            text: "Ouvrir",
            onPress: () => {
              // Ici, vous pouvez ajouter la logique pour ouvrir le rapport
              console.log("Ouverture du rapport");
            },
          },
        ]
      );
    }, 2000);
  };

  const handleReportTypeSelect = (reportId) => {
    setSelectedReport(reportId);
  };

  const toggleMonthsDropdown = () => {
    setShowMonths(!showMonths);
    if (showYears) setShowYears(false);
    if (showCollecteurs) setShowCollecteurs(false);
  };

  const toggleYearsDropdown = () => {
    setShowYears(!showYears);
    if (showMonths) setShowMonths(false);
    if (showCollecteurs) setShowCollecteurs(false);
  };

  const toggleCollecteursDropdown = () => {
    setShowCollecteurs(!showCollecteurs);
    if (showMonths) setShowMonths(false);
    if (showYears) setShowYears(false);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month.id);
    setShowMonths(false);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowYears(false);
  };

  const handleCollecteurSelect = (collecteur) => {
    setSelectedCollecteur(collecteur);
    setShowCollecteurs(false);
  };

  const renderMonthItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, selectedMonth === item.id && styles.selectedDropdownItem]}
      onPress={() => handleMonthSelect(item)}
    >
      <Text 
        style={[
          styles.dropdownItemText, 
          selectedMonth === item.id && styles.selectedDropdownItemText
        ]}
      >
        {item.name}
      </Text>
      {selectedMonth === item.id && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderYearItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, selectedYear === item && styles.selectedDropdownItem]}
      onPress={() => handleYearSelect(item)}
    >
      <Text 
        style={[
          styles.dropdownItemText, 
          selectedYear === item && styles.selectedDropdownItemText
        ]}
      >
        {item}
      </Text>
      {selectedYear === item && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderCollecteurItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem, 
        selectedCollecteur?.id === item.id && styles.selectedDropdownItem
      ]}
      onPress={() => handleCollecteurSelect(item)}
    >
      <Text 
        style={[
          styles.dropdownItemText, 
          selectedCollecteur?.id === item.id && styles.selectedDropdownItemText
        ]}
      >
        {item.prenom} {item.nom} ({item.agence.nomAgence})
      </Text>
      {selectedCollecteur?.id === item.id && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Génération de rapports"
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={styles.reportTypesContainer}>
          <Text style={styles.sectionTitle}>Type de rapport</Text>
          <View style={styles.reportTypes}>
            {generateOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.reportTypeButton,
                  selectedReport === option.id && styles.selectedReportTypeButton
                ]}
                onPress={() => handleReportTypeSelect(option.id)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={selectedReport === option.id ? theme.colors.white : theme.colors.primary} 
                />
                <Text 
                  style={[
                    styles.reportTypeButtonText,
                    selectedReport === option.id && styles.selectedReportTypeButtonText
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <Card style={styles.filtersCard}>
          <Text style={styles.sectionTitle}>Paramètres du rapport</Text>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Mois</Text>
            <TouchableOpacity
              style={styles.filterSelector}
              onPress={toggleMonthsDropdown}
            >
              <Text style={styles.filterValue}>
                {months.find(m => m.id === selectedMonth)?.name}
              </Text>
              <Ionicons 
                name={showMonths ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.gray} 
              />
            </TouchableOpacity>
          </View>
          
          {showMonths && (
            <View style={styles.dropdown}>
              <FlatList
                data={months}
                renderItem={renderMonthItem}
                keyExtractor={item => item.id.toString()}
                style={styles.dropdownList}
              />
            </View>
          )}
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Année</Text>
            <TouchableOpacity
              style={styles.filterSelector}
              onPress={toggleYearsDropdown}
            >
              <Text style={styles.filterValue}>{selectedYear}</Text>
              <Ionicons 
                name={showYears ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.gray} 
              />
            </TouchableOpacity>
          </View>
          
          {showYears && (
            <View style={styles.dropdown}>
              <FlatList
                data={years}
                renderItem={renderYearItem}
                keyExtractor={item => item.toString()}
                style={styles.dropdownList}
              />
            </View>
          )}
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Collecteur</Text>
            <TouchableOpacity
              style={styles.filterSelector}
              onPress={toggleCollecteursDropdown}
            >
              <Text style={styles.filterValue}>
                {selectedCollecteur 
                  ? `${selectedCollecteur.prenom} ${selectedCollecteur.nom}`
                  : 'Tous les collecteurs'}
              </Text>
              <Ionicons 
                name={showCollecteurs ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.gray} 
              />
            </TouchableOpacity>
          </View>
          
          {showCollecteurs && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem, 
                  !selectedCollecteur && styles.selectedDropdownItem
                ]}
                onPress={() => setSelectedCollecteur(null)}
              >
                <Text 
                  style={[
                    styles.dropdownItemText, 
                    !selectedCollecteur && styles.selectedDropdownItemText
                  ]}
                >
                  Tous les collecteurs
                </Text>
                {!selectedCollecteur && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              <FlatList
                data={mockCollecteurs}
                renderItem={renderCollecteurItem}
                keyExtractor={item => item.id.toString()}
                style={styles.dropdownList}
              />
            </View>
          )}
        </Card>
        
        <View style={styles.generateButtonContainer}>
          <Button
            title="Générer le rapport"
            onPress={handleGenerateReport}
            loading={isLoading}
            fullWidth
          />
        </View>
        
        <Card style={styles.recentReportsCard}>
          <Text style={styles.sectionTitle}>Rapports récents</Text>
          
          <View style={styles.recentReportItem}>
            <View style={styles.recentReportIcon}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.recentReportInfo}>
              <Text style={styles.recentReportTitle}>Rapport mensuel - Mars 2025</Text>
              <Text style={styles.recentReportDate}>Généré le 31/03/2025</Text>
            </View>
            <TouchableOpacity style={styles.recentReportDownload}>
              <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentReportItem}>
            <View style={styles.recentReportIcon}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.recentReportInfo}>
              <Text style={styles.recentReportTitle}>Rapport des commissions - Février 2025</Text>
              <Text style={styles.recentReportDate}>Généré le 28/02/2025</Text>
            </View>
            <TouchableOpacity style={styles.recentReportDownload}>
              <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentReportItem}>
            <View style={styles.recentReportIcon}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.recentReportInfo}>
              <Text style={styles.recentReportTitle}>Rapport de synthèse - Janvier 2025</Text>
              <Text style={styles.recentReportDate}>Généré le 31/01/2025</Text>
            </View>
            <TouchableOpacity style={styles.recentReportDownload}>
              <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },
  reportTypesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  reportTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportTypeButton: {
    width: '32%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...theme.shadows.small,
  },
  selectedReportTypeButton: {
    backgroundColor: theme.colors.primary,
  },
  reportTypeButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedReportTypeButtonText: {
    color: theme.colors.white,
  },
  filtersCard: {
    marginBottom: 20,
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 150,
  },
  filterValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  dropdown: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
    ...theme.shadows.small,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(0, 186, 136, 0.1)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedDropdownItemText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  generateButtonContainer: {
    marginBottom: 20,
  },
  recentReportsCard: {
    padding: 16,
  },
  recentReportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  recentReportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 186, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentReportInfo: {
    flex: 1,
  },
  recentReportTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  recentReportDate: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  recentReportDownload: {
    padding: 8,
  },
});

export default ReportsScreen;