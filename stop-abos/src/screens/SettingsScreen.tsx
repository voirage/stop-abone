import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }: any) {
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.profileBox}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={styles.userName}>Mon Compte</Text>
          <Text style={styles.userEmail}>Connecté et synchronisé</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.textLight} />
              <Text style={styles.menuItemText}>Notifications de prélèvement</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.textLight} />
              <Text style={styles.menuItemText}>Thème (Sombre activé)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.textLight} />
              <Text style={styles.menuItemText}>Politique de confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>

      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Se déconnecter" 
          type="outline" 
          icon="log-out-outline"
          onPress={logout} 
        />
        <Text style={styles.version}>STOP-ABOS v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  
  profileBox: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 2, borderColor: colors.border },
  userName: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  userEmail: { fontSize: 14, color: colors.success },
  
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textLight, textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 16, color: colors.text, marginLeft: 15 },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  version: { textAlign: 'center', color: colors.textLight, marginTop: 15, fontSize: 12 }
});
