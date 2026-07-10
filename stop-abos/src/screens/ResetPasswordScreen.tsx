import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
  route: RouteProp<RootStackParamList, 'ResetPassword'>;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!code || !newPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, nouveau_mot_de_passe: newPassword })
      });
      const data = await response.json();
      setLoading(false);
      
      if (response.ok) {
        Alert.alert('Succès', 'Votre mot de passe a été réinitialisé ! Vous pouvez maintenant vous connecter.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Erreur', data.detail || 'Code invalide ou expiré');
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau mot de passe</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>Le code a été envoyé à {email}. Veuillez le saisir pour changer votre mot de passe.</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="keypad-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Code à 6 chiffres" 
            placeholderTextColor={colors.textLight}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Nouveau mot de passe" 
            placeholderTextColor={colors.textLight}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <Button title="Enregistrer le nouveau mot de passe" onPress={handleReset} icon="checkmark-circle-outline" type="success" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { flex: 1, padding: 25, justifyContent: 'center' },
  description: { color: colors.textLight, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 16, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: colors.text },
});
