import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'danger' | 'success' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function Button({ title, onPress, type = 'primary', style, textStyle, icon }: ButtonProps) {
  const isOutline = type === 'outline';
  let gradientColors = colors.gradientPrimary;
  
  if (type === 'danger') gradientColors = colors.gradientDanger;
  if (type === 'success') gradientColors = colors.gradientSuccess;

  const content = (
    <View style={styles.contentContainer}>
      {icon && <Ionicons name={icon} size={20} color={isOutline ? colors.primary : '#FFF'} style={styles.icon} />}
      <Text style={[styles.text, { color: isOutline ? colors.primary : '#FFF' }, textStyle]}>
        {title}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity 
      style={[styles.buttonContainer, style, isOutline && styles.outlineButton]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isOutline ? (
        content
      ) : (
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});
