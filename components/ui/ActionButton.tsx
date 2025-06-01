// components/ui/ActionButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  gradient?: string[];
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
  gradient = ['#6366f1', '#4f46e5'],
  disabled = false,
}) => {
  return (
    <TouchableOpacity 
      style={[styles.actionButton, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={disabled ? ['#555', '#444'] : gradient}
        style={styles.actionGradient}
      >
        <Ionicons name={icon} size={32} color="#fff" />
      </LinearGradient>
      <Text style={[styles.actionButtonText, disabled && styles.disabledText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#888',
  },
});