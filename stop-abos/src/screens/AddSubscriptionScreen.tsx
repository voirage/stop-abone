import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { SubscriptionContext } from '../context/SubscriptionContext';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddSubscription'>;
};

export default function AddSubscriptionScreen({ navigation }: Props) {
  const { ajouterAbonnement } = useContext(SubscriptionContext);
  
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [categorie, setCategorie] = useState('');
  const [numeroContrat, setNumeroContrat] = useState('');
  const [renouvellementAuto, setRenouvellementAuto] = useState(true);

  const handleSave = () => {
    if(!nom || !prix) return;
    
    ajouterAbonnement({
      nom,
      categorie: categorie || 'Autres',
      prix: parseFloat(prix),
      frequence: 'mensuel',
      prochaine_date_renouvellement: '2026-08-01',
      numero_contrat: numeroContrat || undefined,
      statut: 'actif',
      renouvellement_auto: renouvellementAuto
    });
    
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvel Abonnement</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom du service</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={nom} 
                onChangeText={setNom} 
                placeholder="Ex: Netflix, Free..." 
                placeholderTextColor={colors.textLight} 
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Prix mensuel (€)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={prix} 
                onChangeText={setPrix} 
                placeholder="Ex: 13.99" 
                keyboardType="numeric" 
                placeholderTextColor={colors.textLight} 
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Numéro de contrat (Optionnel)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={numeroContrat} 
                onChangeText={setNumeroContrat} 
                placeholder="Ex: CLI-123456" 
                placeholderTextColor={colors.textLight} 
              />
            </View>
            <Text style={styles.helperText}>Utile pour générer automatiquement la lettre de résiliation.</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="folder-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={categorie} 
                onChangeText={setCategorie} 
                placeholder="Ex: Streaming, Télécom" 
                placeholderTextColor={colors.textLight} 
              />
            </View>
          </View>
          
          <View style={[styles.formGroup, styles.switchGroup]}>
            <View>
              <Text style={styles.label}>Renouvellement automatique</Text>
              <Text style={styles.helperText}>Calculé dans le STOP SCORE</Text>
            </View>
            <Switch
              value={renouvellementAuto}
              onValueChange={setRenouvellementAuto}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={'#ffffff'}
            />
          </View>
          
          <Button title="Enregistrer l'abonnement" type="success" icon="checkmark-circle-outline" onPress={handleSave} style={{ marginTop: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: colors.textLight, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.text },
  helperText: { fontSize: 12, color: colors.textLight, marginTop: 6, fontStyle: 'italic' },
  switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
