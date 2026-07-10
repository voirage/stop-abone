import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Abonnement } from '../models/types';
import { colors } from '../theme/colors';

interface Props {
  abonnement: Abonnement;
  onPress?: () => void;
}

export default function SubscriptionCard({ abonnement, onPress }: Props) {
  const getStatusColor = () => {
    if (abonnement.statut === 'actif') return colors.success;
    if (abonnement.statut === 'a_resilier') return colors.warning;
    return colors.danger;
  };

  const getStatusText = () => {
    if (abonnement.statut === 'actif') return 'Actif';
    if (abonnement.statut === 'a_resilier') return 'En cours';
    return 'Résilié';
  };

  const getStatusIcon = () => {
    if (abonnement.statut === 'actif') return 'checkmark-circle';
    if (abonnement.statut === 'a_resilier') return 'time';
    return 'close-circle';
  };

  // Icône dynamique basée sur la catégorie
  const getCategoryIcon = () => {
    const cat = abonnement.categorie.toLowerCase();
    if (cat.includes('streaming')) return 'play-circle';
    if (cat.includes('telecom') || cat.includes('télécom') || cat.includes('internet')) return 'wifi';
    if (cat.includes('banque') || cat.includes('assurance')) return 'shield-checkmark';
    if (cat.includes('sport')) return 'barbell';
    return 'card';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={getCategoryIcon()} size={24} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.subName}>{abonnement.nom}</Text>
          <Text style={styles.subCategory}>{abonnement.categorie}</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text style={styles.subPrice}>{abonnement.prix.toFixed(2)} €</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons name={getStatusIcon()} size={12} color={getStatusColor()} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  subCategory: { color: colors.textLight, fontSize: 12 },
  rightContent: {
    alignItems: 'flex-end',
  },
  subPrice: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
});
