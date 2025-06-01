// components/ui/TreasureCard.tsx - Complete
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Treasure {
  id: string;
  name: string;
  description: string;
  rarity: number;
  distance: number;
  imageUrl: string;
  requiredRank: number;
}

interface TreasureCardProps {
  treasure: Treasure;
  onPress: () => void;
  getRarityColor: (rarity: number) => string;
  getRarityText: (rarity: number) => string;
  formatDistance: (distance: number) => string;
}

export const TreasureCard: React.FC<TreasureCardProps> = ({
  treasure,
  onPress,
  getRarityColor,
  getRarityText,
  formatDistance,
}) => {
  return (
    <TouchableOpacity
      style={[styles.treasureCard, { borderLeftColor: getRarityColor(treasure.rarity) }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: treasure.imageUrl }}
        style={styles.treasureImage}
        resizeMode="cover"
      />
      <View style={styles.treasureInfo}>
        <Text style={styles.treasureName}>{treasure.name}</Text>
        <Text style={styles.treasureDescription} numberOfLines={2}>
          {treasure.description}
        </Text>
        <View style={styles.treasureMetadata}>
          <View style={styles.rarityBadge}>
            <View style={[
              styles.rarityDot, 
              { backgroundColor: getRarityColor(treasure.rarity) }
            ]} />
            <Text style={[
              styles.rarityText, 
              { color: getRarityColor(treasure.rarity) }
            ]}>
              {getRarityText(treasure.rarity)}
            </Text>
          </View>
          <Text style={styles.distanceText}>
            <Ionicons name="location-outline" size={12} color="#666" /> 
            {formatDistance(treasure.distance)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  treasureCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 12,
    alignItems: 'center',
  },
  treasureImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  treasureInfo: {
    flex: 1,
  },
  treasureName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  treasureDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 18,
  },
  treasureMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
});