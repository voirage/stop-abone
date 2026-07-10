import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login, register } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMsg('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    let success = false;
    
    if (isRegistering) {
      success = await register(email, password);
    } else {
      success = await login(email, password);
    }
    
    setLoading(false);
    if (!success) {
      setErrorMsg(isRegistering ? 'Email déjà utilisé ou erreur serveur.' : 'Email ou mot de passe incorrect.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
          <Text style={styles.title}>STOP-ABOS</Text>
          <Text style={styles.subtitle}>Reprenez le contrôle de vos finances</Text>
        </View>
        
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Mot de passe" 
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button 
              title={isRegistering ? "S'inscrire" : "Se connecter"} 
              onPress={handleSubmit} 
              icon="log-in-outline"
            />
            
            <Button 
              title={isRegistering ? "J'ai déjà un compte" : "Créer un nouveau compte"} 
              type="outline"
              onPress={() => setIsRegistering(!isRegistering)} 
            />
            
            {!isRegistering && (
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 25 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 36, fontWeight: 'bold', color: colors.text, marginTop: 15, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: colors.textLight, marginTop: 10 },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: colors.text },
  
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: 20, fontSize: 14 },
  buttonContainer: { marginTop: 15 }
});
