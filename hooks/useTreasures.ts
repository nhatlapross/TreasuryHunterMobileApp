// hooks/useTreasures.ts - Hook for treasure hunting functionality
import { apiService } from '@/services/APIService';
import { useCallback, useState } from 'react';

interface Treasure {
  treasureId: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  rarity: number;
  rarityName: string;
  rewardPoints: number;
  distance: number;
  canHunt: boolean;
  imageUrl: string;
  requiredRank: number;
  requiredRankName: string;
}

interface TreasureDiscovery {
  discoveryId: string;
  discoveredAt: string;
  distance: number;
  method: string;
}

interface DiscoveryResult {
  discovery: TreasureDiscovery;
  nft?: {
    objectId: string;
    transactionDigest: string;
    onChain: boolean;
    explorerUrl?: string;
  };
  treasure: Treasure;
  profile: {
    oldRank: string;
    newRank: string;
    rankUpgraded: boolean;
    pointsEarned: number;
    totalTreasures: number;
    currentStreak: number;
  };
}

export const useTreasures = () => {
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNearbyTreasures = useCallback(async (latitude: number, longitude: number, radius: number = 5000) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🗺️ Getting treasures near: ${latitude}, ${longitude}`);

      const response = await apiService.getNearbyTreasures(latitude, longitude, radius);

      if (response.success && response.data) {
        setTreasures(response.data.treasures);
        console.log(`✅ Found ${response.data.treasures.length} nearby treasures`);
        return response.data;
      } else {
        throw new Error('Failed to get nearby treasures');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get treasures';
      setError(errorMessage);
      console.error('❌ Failed to get nearby treasures:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const discoverTreasure = useCallback(async (
    treasureId: string,
    location: { latitude: number; longitude: number },
    locationProof: string,
    nfcData?: any,
    qrData?: any
  ): Promise<DiscoveryResult> => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🏴‍☠️ Discovering treasure: ${treasureId}`);

      const response = await apiService.discoverTreasure(
        treasureId,
        location,
        locationProof,
        nfcData,
        qrData
      );

      if (response.success && response.data) {
        console.log(`🎉 Treasure discovered successfully: ${response.data.treasure.name}`);
        
        // Remove the discovered treasure from the list
        setTreasures(prev => prev.filter(t => t.treasureId !== treasureId));
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to discover treasure');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to discover treasure';
      setError(errorMessage);
      console.error('❌ Failed to discover treasure:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyTreasure = useCallback(async (treasureId: string) => {
    try {
      console.log(`🔍 Verifying treasure: ${treasureId}`);
      
      const response = await apiService.verifyTreasure(treasureId);
      
      if (response.success) {
        console.log(`✅ Treasure verification: ${response.data.canHunt ? 'Can hunt' : 'Cannot hunt'}`);
        return response.data;
      } else {
        throw new Error('Failed to verify treasure');
      }
    } catch (err) {
      console.error('❌ Failed to verify treasure:', err);
      throw err;
    }
  }, []);

  return {
    treasures,
    loading,
    error,
    getNearbyTreasures,
    discoverTreasure,
    verifyTreasure,
  };
};

