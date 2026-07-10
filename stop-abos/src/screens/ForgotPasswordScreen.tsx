import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre e-mail');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setLoading(false);
      
      // En MVP, on simule l'email et on affiche le code
      if (data.simulated_code) {
        Alert.alert('Email Simulé (Test)', `Votre code de réinitialisation est : ${data.simulated_code}`);
        navigation.navigate('ResetPassword', { email });
      } else {
        navigation.navigate('ResetPassword', { email });
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
        <Text style={styles.headerTitle}>Mot de passe oublié</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>Entrez votre adresse e-mail pour recevoir un code de réinitialisation à 6 chiffres.</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Votre Email" 
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <Button title="Envoyer le code" onPress={handleSendCode} icon="paper-plane-outline" />
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
