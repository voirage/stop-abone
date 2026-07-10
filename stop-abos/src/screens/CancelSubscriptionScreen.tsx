import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { SubscriptionContext } from '../context/SubscriptionContext';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CancelSubscription'>;
  route: RouteProp<RootStackParamList, 'CancelSubscription'>;
};

export default function CancelSubscriptionScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { modifierStatut } = useContext(SubscriptionContext);
  const { token } = useContext(AuthContext);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfirmCancel = () => {
    modifierStatut(id, 'a_resilier');
    navigation.navigate('Dashboard');
  };

  const handleMarkAsCancelled = () => {
    modifierStatut(id, 'resilie');
    navigation.navigate('Dashboard');
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté.");
        return;
      }

      const url = `${API_BASE_URL}/abonnements/${id}/lettre-resiliation`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        Alert.alert("Erreur", "Impossible de générer le PDF.");
        return;
      }

      if (Platform.OS === "web") {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `lettre_resiliation_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(blobUrl);
        return;
      }

      const dir = (FileSystem as any).documentDirectory || "";
      const fileUri = `${dir}lettre_resiliation_${id}.pdf`;

      const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadRes.status !== 200) {
        Alert.alert("Erreur", "Impossible de générer le PDF.");
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Partager la lettre de résiliation",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Une erreur réseau est survenue.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Procédure de Résiliation</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={32} color={colors.danger} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Attention</Text>
          <Text style={styles.description}>
            La suppression de cet abonnement de l'application ne résilie pas le contrat auprès du fournisseur. Vous devez envoyer une lettre de résiliation.
          </Text>
        </View>

        <View style={styles.actionsBox}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.sectionTitle}>Créer la lettre (PDF)</Text>
          </View>
          <Text style={styles.stepDescription}>Générez une lettre conforme (Loi Chatel / Hamon) prête à être envoyée ou imprimée.</Text>

          {isGenerating ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 15 }} />
          ) : (
            <Button
              title="Télécharger la lettre"
              type="primary"
              icon="download-outline"
              onPress={generatePDF}
            />
          )}
        </View>

        <View style={styles.actionsBox}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.sectionTitle}>Mettre à jour le suivi</Text>
          </View>
          <Text style={styles.stepDescription}>Une fois la démarche effectuée, mettez à jour l'application pour vos statistiques.</Text>

          <Button
            title="Marquer comme 'En cours'"
            type="outline"
            icon="time-outline"
            onPress={handleConfirmCancel}
          />
          <Button
            title="Marquer comme 'Résilié'"
            type="danger"
            icon="trash-outline"
            onPress={handleMarkAsCancelled}
          />
        </View>

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

  warningBox: { alignItems: 'center', marginBottom: 25, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.danger, marginBottom: 10 },
  description: { fontSize: 15, color: colors.textLight, textAlign: 'center', lineHeight: 22 },

  actionsBox: { backgroundColor: colors.card, padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  stepDescription: { color: colors.textLight, fontSize: 14, marginBottom: 15, lineHeight: 20 }
});
