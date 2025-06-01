// hooks/useProfile.ts - Hook for profile functionality
import { apiService } from '@/services/APIService';
import { useCallback, useState } from 'react';

interface ProfileStats {
  user: {
    userId: string;
    username: string;
    email: string;
    suiAddress: string;
    rank: string;
  };
  profile: {
    totalTreasuresFound: number;
    totalScore: number;
    currentStreak: number;
    longestStreak: number;
  };
  wallet: {
    balanceSui: string;
    totalEarnedSui: string;
  };
  achievements: {
    total: number;
    recent: any[];
  };
  leaderboard: {
    position: number | null;
  };
}

export const useProfile = () => {
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfileStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getProfileStats();

      if (response.success && response.data) {
        setProfileStats(response.data);
        console.log(`📊 Profile stats loaded for: ${response.data.user.username}`);
        return response.data;
      } else {
        throw new Error('Failed to get profile stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get profile';
      setError(errorMessage);
      console.error('❌ Failed to get profile stats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (username?: string, email?: string, avatarUrl?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.updateProfile(username, email, avatarUrl);

      if (response.success) {
        console.log('✅ Profile updated successfully');
        // Refresh profile stats
        await getProfileStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      console.error('❌ Failed to update profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getProfileStats]);

  const createBlockchainProfile = useCallback(async (username?: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('⛓️ Creating blockchain profile...');

      const response = await apiService.createBlockchainProfile(username);

      if (response.success) {
        console.log(`✅ Blockchain profile created: ${response.data.profileObjectId}`);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create blockchain profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create blockchain profile';
      setError(errorMessage);
      console.error('❌ Failed to create blockchain profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profileStats,
    loading,
    error,
    getProfileStats,
    updateProfile,
    createBlockchainProfile,
  };
};

// utils/helpers.ts - Utility functions
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

export const formatDate = (timestamp: string | number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRarityColor = (rarity: number): string => {
  switch (rarity) {
    case 3: return '#ffd700'; // Legendary - Gold
    case 2: return '#c084fc'; // Rare - Purple
    case 1: return '#10b981'; // Common - Green
    default: return '#6b7280'; // Unknown - Gray
  }
};

export const getRarityName = (rarity: number): string => {
  switch (rarity) {
    case 3: return 'Legendary';
    case 2: return 'Rare';
    case 1: return 'Common';
    default: return 'Unknown';
  }
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const formatSuiAmount = (amountInMist: string | number): string => {
  const sui = Number(amountInMist) / 1000000000;
  return sui.toFixed(4);
};

export const getRankColor = (rank: string): string => {
  switch (rank.toLowerCase()) {
    case 'master': return '#f59e0b';
    case 'hunter': return '#8b5cf6';
    case 'explorer': return '#3b82f6';
    case 'beginner': return '#10b981';
    default: return '#6b7280';
  }
};

export const getNextRankRequirement = (rank: string, currentTreasures: number): { nextRank: string; treasuresNeeded: number } => {
  switch (rank.toLowerCase()) {
    case 'beginner':
      return { nextRank: 'Explorer', treasuresNeeded: Math.max(0, 5 - currentTreasures) };
    case 'explorer':
      return { nextRank: 'Hunter', treasuresNeeded: Math.max(0, 20 - currentTreasures) };
    case 'hunter':
      return { nextRank: 'Master', treasuresNeeded: Math.max(0, 50 - currentTreasures) };
    case 'master':
      return { nextRank: 'Max Level', treasuresNeeded: 0 };
    default:
      return { nextRank: 'Explorer', treasuresNeeded: 5 };
  }
};