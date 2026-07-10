import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import AddSubscriptionScreen from '../screens/AddSubscriptionScreen';
import SubscriptionDetailScreen from '../screens/SubscriptionDetailScreen';
import CancelSubscriptionScreen from '../screens/CancelSubscriptionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Subscriptions: undefined;
  AddSubscription: undefined;
  SubscriptionDetail: { id: number };
  CancelSubscription: { id: number };
  Settings: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token === null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
            <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
            <Stack.Screen name="CancelSubscription" component={CancelSubscriptionScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
