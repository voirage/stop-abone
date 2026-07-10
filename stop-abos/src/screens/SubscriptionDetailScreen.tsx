import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { SubscriptionContext } from '../context/SubscriptionContext';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SubscriptionDetail'>;
  route: RouteProp<RootStackParamList, 'SubscriptionDetail'>;
};

export default function SubscriptionDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { abonnements } = useContext(SubscriptionContext);
  const abonnement = abonnements.find(a => Number(a.id) === Number(id));

  if (!abonnement) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={32} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{abonnement.nom}</Text>
              <Text style={styles.category}>{abonnement.categorie}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="cash-outline" size={18} color={colors.textLight} />
              <Text style={styles.label}>Prix :</Text>
            </View>
            <Text style={styles.value}>{abonnement.prix.toFixed(2)} € / {abonnement.frequence}</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
              <Text style={styles.label}>Prochain paiement :</Text>
            </View>
            <Text style={styles.value}>{abonnement.prochaine_date_renouvellement}</Text>
          </View>
          
          {abonnement.numero_contrat && (
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <Ionicons name="document-text-outline" size={18} color={colors.textLight} />
                <Text style={styles.label}>N° Contrat :</Text>
              </View>
              <Text style={styles.value}>{abonnement.numero_contrat}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textLight} />
              <Text style={styles.label}>Statut :</Text>
            </View>
            <Text style={[styles.value, { color: abonnement.statut === 'actif' ? colors.success : abonnement.statut === 'a_resilier' ? colors.warning : colors.danger }]}>
              {abonnement.statut === 'actif' ? 'Actif' : abonnement.statut === 'a_resilier' ? 'En cours de résiliation' : 'Résilié'}
            </Text>
          </View>
        </View>

        {abonnement.statut !== 'resilie' && (
          <Button 
            title="Je veux résilier" 
            type="danger" 
            icon="warning-outline"
            onPress={() => navigation.navigate('CancelSubscription', { id: Number(abonnement.id) })} 
            style={{ marginTop: 20 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  card: { backgroundColor: colors.card, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  category: { fontSize: 14, color: colors.textLight, textTransform: 'uppercase', fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  rowLabel: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 15, color: colors.textLight, marginLeft: 8 },
  value: { fontSize: 15, fontWeight: 'bold', color: colors.text }
});
