// app/admin/commission-tiers.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Button, Input } from '../../src/components';
import theme from '../../src/theme';

export default function CommissionTiersPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Convertir les paliers de la chaîne JSON si disponibles
  const initialTiers = params.tiers 
    ? (typeof params.tiers === 'string' ? JSON.parse(params.tiers) : params.tiers) 
    : [];
  
  const [tiers, setTiers] = useState(initialTiers.length ? initialTiers : [
    { min: 0, max: 1000, rate: 5 },
    { min: 1001, max: 5000, rate: 4 },
    { min: 5001, max: 999999999, rate: 3 }
  ]);
  
  const [editing, setEditing] = useState(null);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [rate, setRate] = useState('');

  // Ajouter un nouveau palier
  const addTier = () => {
    setEditing({
      isNew: true,
      index: tiers.length,
      min: tiers.length ? (parseInt(tiers[tiers.length-1].max) + 1).toString() : '0',
      max: '',
      rate: ''
    });
    
    // Préremplir les valeurs
    setMin(tiers.length ? (parseInt(tiers[tiers.length-1].max) + 1).toString() : '0');
    setMax('');
    setRate('');
  };

  // Modifier un palier existant
  const editTier = (index) => {
    const tier = tiers[index];
    setEditing({
      isNew: false,
      index,
      min: tier.min.toString(),
      max: tier.max.toString(),
      rate: tier.rate.toString()
    });
    
    // Préremplir les valeurs
    setMin(tier.min.toString());
    setMax(tier.max.toString());
    setRate(tier.rate.toString());
  };

  // Supprimer un palier
  const deleteTier = (index) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer ce palier ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => {
            const newTiers = [...tiers];
            newTiers.splice(index, 1);
            setTiers(newTiers);
          }
        }
      ]
    );
  };

  // Enregistrer les modifications d'un palier
  const saveTier = () => {
    // Validation
    if (!min || !rate || (max === '' && editing.index < tiers.length - 1)) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    const minValue = parseInt(min);
    const maxValue = max === '' ? null : parseInt(max);
    const rateValue = parseFloat(rate);
    
    // Vérifier que le taux est entre 0 et 100
    if (rateValue < 0 || rateValue > 100) {
      Alert.alert("Erreur", "Le taux doit être compris entre 0 et 100%");
      return;
    }
    
    // Vérifier que min est inférieur à max
    if (maxValue !== null && minValue >= maxValue) {
      Alert.alert("Erreur", "Le montant minimum doit être inférieur au montant maximum");
      return;
    }
    
    // Vérifier que le palier ne chevauche pas les autres
    const newTiers = [...tiers];
    
    if (editing.isNew) {
      // Ajouter un nouveau palier
      newTiers.push({
        min: minValue,
        max: maxValue === null ? 999999999 : maxValue,
        rate: rateValue
      });
    } else {
      // Modifier un palier existant
      newTiers[editing.index] = {
        min: minValue,
        max: maxValue === null ? 999999999 : maxValue,
        rate: rateValue
      };
    }
    
    // Trier les paliers par montant minimum
    newTiers.sort((a, b) => a.min - b.min);
    
    // Vérifier les chevauchements
    for (let i = 0; i < newTiers.length - 1; i++) {
      if (newTiers[i].max >= newTiers[i + 1].min) {
        Alert.alert("Erreur", "Les paliers se chevauchent. Veuillez vérifier les montants.");
        return;
      }
    }
    
    setTiers(newTiers);
    setEditing(null);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditing(null);
  };

  // Sauvegarder et retourner à l'écran précédent
  const saveAndReturn = () => {
    // Vérifier si les paliers sont valides
    if (tiers.length === 0) {
      Alert.alert("Erreur", "Vous devez définir au moins un palier");
      return;
    }
    
    // Appeler la fonction de callback si disponible
    if (params.onSave && typeof window !== 'undefined') {
      // Stocker temporairement les paliers dans le stockage de session
      sessionStorage.setItem('commissionTiers', JSON.stringify(tiers));
    }
    
    // Retourner à l'écran précédent avec les données
    router.navigate({
      pathname: '/admin/parameter-management', 
      params: { updatedTiers: JSON.stringify(tiers) }
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Configuration des paliers"
        onBackPress={() => router.back()}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Configurez les paliers de commission. Pour chaque tranche de montant, définissez un taux de commission en pourcentage.
        </Text>
        
        {/* Liste des paliers */}
        {tiers.map((tier, index) => (
          <Card key={index} style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierTitle}>Palier {index + 1}</Text>
              <View style={styles.tierActions}>
                <TouchableOpacity onPress={() => editTier(index)} style={styles.actionButton}>
                  <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTier(index)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.tierDetails}>
              <Text style={styles.tierLabel}>Montant minimum:</Text>
              <Text style={styles.tierValue}>{tier.min.toLocaleString()} FCFA</Text>
            </View>
            
            <View style={styles.tierDetails}>
              <Text style={styles.tierLabel}>Montant maximum:</Text>
              <Text style={styles.tierValue}>
                {tier.max === 999999999 ? "Infini" : `${tier.max.toLocaleString()} FCFA`}
              </Text>
            </View>
            
            <View style={styles.tierDetails}>
              <Text style={styles.tierLabel}>Taux de commission:</Text>
              <Text style={styles.tierValue}>{tier.rate}%</Text>
            </View>
          </Card>
        ))}
        
        {/* Bouton pour ajouter un palier */}
        {!editing && (
          <Button 
            title="Ajouter un palier" 
            onPress={addTier}
            icon={<Ionicons name="add-circle-outline" size={20} color={theme.colors.white} />}
            style={styles.addButton}
          />
        )}
        
        {/* Formulaire d'édition */}
        {editing && (
          <Card style={styles.editCard}>
            <Text style={styles.editTitle}>
              {editing.isNew ? "Ajouter un palier" : `Modifier le palier ${editing.index + 1}`}
            </Text>
            
            <Input
              label="Montant minimum (FCFA) *"
              value={min}
              onChangeText={setMin}
              keyboardType="numeric"
              style={styles.input}
              disabled={!editing.isNew && editing.index > 0}
            />
            
            <Input
              label={`Montant maximum (FCFA)${editing.index === tiers.length - 1 ? ' (laisser vide pour infini)' : ' *'}`}
              value={max}
              onChangeText={setMax}
              keyboardType="numeric"
              style={styles.input}
            />
            
            <Input
              label="Taux de commission (%) *"
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
              style={styles.input}
            />
            
            <View style={styles.editActions}>
              <Button 
                title="Annuler"
                variant="outlined"
                onPress={cancelEdit}
                style={styles.cancelButton}
              />
              <Button 
                title="Enregistrer"
                onPress={saveTier}
                style={styles.saveButton}
              />
            </View>
          </Card>
        )}
        
        {/* Bouton de sauvegarde global */}
        <Button
          title="Enregistrer tous les paliers"
          onPress={saveAndReturn}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 20,
    lineHeight: 22,
  },
  tierCard: {
    marginBottom: 16,
    padding: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
    paddingBottom: 8,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  tierActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 16,
    padding: 4,
  },
  tierDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  tierValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  editCard: {
    padding: 16,
    marginBottom: 24,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 16,
  },
});