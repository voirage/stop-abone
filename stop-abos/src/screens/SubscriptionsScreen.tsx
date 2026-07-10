import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { SubscriptionContext } from '../context/SubscriptionContext';
import SubscriptionCard from '../components/SubscriptionCard';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Subscriptions'>;
};

export default function SubscriptionsScreen({ navigation }: Props) {
  const { abonnements } = useContext(SubscriptionContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tous mes abonnements</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <FlatList
        data={abonnements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SubscriptionCard 
            abonnement={item} 
            onPress={() => navigation.navigate('SubscriptionDetail', { id: Number(item.id) })} 
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { padding: 20, paddingBottom: 100 },
});
