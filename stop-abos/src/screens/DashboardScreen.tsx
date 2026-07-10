import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { SubscriptionContext } from '../context/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { abonnements } = useContext(SubscriptionContext);

  const totalMensuel = abonnements
    .filter(a => a.statut !== 'resilie')
    .reduce((acc, a) => acc + (a.frequence === 'mensuel' ? a.prix : a.prix / 12), 0);
    
  const totalAnnuel = abonnements
    .filter(a => a.statut !== 'resilie')
    .reduce((acc, a) => acc + (a.frequence === 'annuel' ? a.prix : a.prix * 12), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bonjour ! 👋</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={26} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={colors.gradientPrimary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>Dépenses Actives</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.summaryAmount}>{totalMensuel.toFixed(2)}</Text>
            <Text style={styles.summaryCurrency}> € / mois</Text>
          </View>
          <Text style={styles.summarySecondary}>≈ {totalAnnuel.toFixed(2)} € / an</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('Subscriptions')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="list" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Mes Abos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('AddSubscription')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="add" size={24} color={colors.success} />
            </View>
            <Text style={styles.actionText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Gérer vos finances</Text>
        {abonnements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>Aucun abonnement enregistré.</Text>
            <Button title="Commencer" type="outline" onPress={() => navigation.navigate('AddSubscription')} style={{ width: '100%' }} />
          </View>
        ) : (
          <Button title="Voir la liste complète" type="outline" onPress={() => navigation.navigate('Subscriptions')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: colors.text },
  
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 35,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  summaryTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 10 },
  amountContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  summaryAmount: { color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' },
  summaryCurrency: { color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '600' },
  summarySecondary: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  actionItem: { 
    flex: 1, 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionText: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  
  emptyState: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20 },
  emptyText: { color: colors.textLight, marginTop: 15, marginBottom: 20, fontSize: 16 },
});
