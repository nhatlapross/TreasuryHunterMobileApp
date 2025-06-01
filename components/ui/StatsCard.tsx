// components/ui/StatsCard.tsx - Complete
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  number: number;
  label: string;
  gradient: string[];
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  number,
  label,
  gradient,
}) => {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradient}
        style={styles.statGradient}
      >
        <Ionicons name={icon} size={24} color="#fff" />
      </LinearGradient>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});