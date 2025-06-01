// services/WalletService.ts - React Native Client
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

interface UserWallet {
id: string;
userId: string;
address: string;
publicKey: string;
createdAt: string;
isActive: boolean;
}

interface TreasureDiscovery {
id: string;
userId: string;
treasureId: string;
walletAddress: string;
locationProof: string;
nftObjectId?: string;
transactionHash?: string;
status: 'pending' | 'minting' | 'completed' | 'failed';
createdAt: string;
}

interface NFT {
objectId: string;
content: any;
display: any;
type: string;
}

export class WalletService {
private baseUrl: string;
private userId: string | null = null;

constructor(baseUrl: string = 'http://your-backend-url.com/api') {
  this.baseUrl = baseUrl;
  this.loadUserId();
}

/**
 * Initialize user and create wallet
 */
async initializeUser(): Promise<UserWallet> {
  try {
    // Get or create user ID
    let userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      userId = this.generateUserId();
      await AsyncStorage.setItem('user_id', userId);
    }
    
    this.userId = userId;

    // Create wallet on backend
    const response = await fetch(`${this.baseUrl}/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create wallet');
    }

    // Cache wallet info locally
    await AsyncStorage.setItem('user_wallet', JSON.stringify(result.wallet));
    
    return result.wallet;
  } catch (error) {
    console.error('Failed to initialize user:', error);
    throw error;
  }
}

/**
 * Discover treasure at current location
 */
async discoverTreasure(treasureId: string): Promise<TreasureDiscovery> {
  try {
    if (!this.userId) {
      throw new Error('User not initialized');
    }

    // Get current location
    const location = await this.getCurrentLocation();
    const locationProof = this.generateLocationProof(location);

    const response = await fetch(`${this.baseUrl}/wallet/discover-treasure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: this.userId,
        treasureId,
        locationProof,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to discover treasure');
    }

    // Cache discovery locally
    await this.cacheDiscovery(result.discovery);
    
    return result.discovery;
  } catch (error) {
    console.error('Failed to discover treasure:', error);
    throw error;
  }
}

/**
 * Get user's NFTs
 */
async getUserNFTs(): Promise<NFT[]> {
  try {
    if (!this.userId) {
      throw new Error('User not initialized');
    }

    const response = await fetch(`${this.baseUrl}/wallet/${this.userId}/nfts`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get NFTs');
    }

    // Cache NFTs locally
    await AsyncStorage.setItem('user_nfts', JSON.stringify(result.nfts));
    
    return result.nfts;
  } catch (error) {
    console.error('Failed to get NFTs:', error);
    
    // Return cached NFTs as fallback
    const cachedNFTs = await AsyncStorage.getItem('user_nfts');
    return cachedNFTs ? JSON.parse(cachedNFTs) : [];
  }
}

/**
 * Get user wallet balance
 */
async getBalance(): Promise<string> {
  try {
    if (!this.userId) {
      throw new Error('User not initialized');
    }

    const response = await fetch(`${this.baseUrl}/wallet/${this.userId}/balance`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get balance');
    }

    return result.balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0';
  }
}

/**
 * Get user wallet info
 */
async getWalletInfo(): Promise<UserWallet | null> {
  try {
    const cachedWallet = await AsyncStorage.getItem('user_wallet');
    return cachedWallet ? JSON.parse(cachedWallet) : null;
  } catch (error) {
    console.error('Failed to get wallet info:', error);
    return null;
  }
}

/**
 * Get cached discoveries
 */
async getCachedDiscoveries(): Promise<TreasureDiscovery[]> {
  try {
    const cached = await AsyncStorage.getItem('treasure_discoveries');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached discoveries:', error);
    return [];
  }
}

/**
 * Get current location with permission handling
 */
private async getCurrentLocation(): Promise<Location.LocationObject> {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  // Get current location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return location;
}

/**
 * Generate location proof
 */
private generateLocationProof(location: Location.LocationObject): string {
  const timestamp = Date.now();
  const coords = `${location.coords.latitude.toFixed(6)},${location.coords.longitude.toFixed(6)}`;
  const accuracy = location.coords.accuracy || 0;
  
  return `${coords}:${timestamp}:${accuracy}`;
}

/**
 * Cache discovery locally
 */
private async cacheDiscovery(discovery: TreasureDiscovery): Promise<void> {
  try {
    const existing = await this.getCachedDiscoveries();
    const updated = [...existing, discovery];
    await AsyncStorage.setItem('treasure_discoveries', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to cache discovery:', error);
  }
}

/**
 * Load user ID from storage
 */
private async loadUserId(): Promise<void> {
  try {
    this.userId = await AsyncStorage.getItem('user_id');
  } catch (error) {
    console.error('Failed to load user ID:', error);
  }
}

/**
 * Generate unique user ID
 */
private generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

/**
 * Format balance for display
 */
formatBalance(balance: string): string {
  const sui = Number(balance) / 1_000_000_000;
  return sui.toFixed(4);
}

/**
 * Reset all data (for testing)
 */
async resetUserData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      'user_id',
      'user_wallet',
      'user_nfts',
      'treasure_discoveries'
    ]);
    
    this.userId = null;
    console.log('✅ User data reset');
  } catch (error) {
    console.error('Failed to reset user data:', error);
    throw error;
  }
}

/**
 * Check if user is initialized
 */
isUserInitialized(): boolean {
  return this.userId !== null;
}
}

// Export singleton instance
export const walletService = new WalletService();