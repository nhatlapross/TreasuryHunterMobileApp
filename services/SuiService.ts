// services/SuiService.ts - Updated with Real Contract Integration
import { fromB64, toB64 } from '@mysten/bcs';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Random from 'expo-random';

// Enhanced crypto polyfill with proper types
declare global {
  var crypto: {
    getRandomValues: (array: Uint8Array) => Uint8Array;
  };
}

// Polyfill for crypto.getRandomValues using expo-crypto
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array: Uint8Array) => {
      // Use expo-random for better entropy
      const randomBytes = Random.getRandomBytesAsync(array.length);
      return randomBytes.then(bytes => {
        array.set(new Uint8Array(bytes));
        return array;
      });
    },
    // Synchronous version using expo-crypto fallback
    getRandomValuesSync: (array: Uint8Array) => {
      const randomBytes = Crypto.getRandomBytes(array.length);
      array.set(randomBytes);
      return array;
    }
  } as any;
  
  // Override with sync version for immediate use
  global.crypto.getRandomValues = global.crypto.getRandomValuesSync;
}

interface TreasureNFT {
  id: string;
  name: string;
  description: string;
  rarity: string;
  foundAt: string;
  locationProof: string;
  imageUrl?: string;
}

interface HunterProfile {
  id: string;
  username: string;
  rank: string;
  totalTreasuresFound: number;
  currentStreak: number;
  createdAt: string;
}

interface TreasureDiscoveryResult {
  transactionDigest: string;
  nftObjectId: string;
  treasureData: any;
  hunterProfileUpdated: boolean;
}

export class SuiService {
  private client: SuiClient;
  private keypair: Ed25519Keypair | null = null;
  
  // Your deployed package ID on testnet
  private packageId: string = '0xbe95e5f80e4795169bfc994cf7fb9740f6ef4caa57f3e8010294eec5d4c1ebbe';
  
  // These need to be set based on your actual deployed objects
  private treasureRegistryId: string | null = null; // Will be fetched/stored
  private hunterProfileId: string | null = null; // Will be fetched/stored
  
  private network: 'testnet' | 'devnet' | 'mainnet' | 'localnet' = 'testnet';
  private isInitialized: boolean = false;

  constructor(network: 'testnet' | 'devnet' | 'mainnet' | 'localnet' = 'testnet') {
    this.network = network;
    this.client = new SuiClient({
      url: getFullnodeUrl(network),
    });
  }

  /**
   * Initialize wallet - create new or load existing
   */
  async initializeWallet(): Promise<string> {
    try {
      if (this.isInitialized && this.keypair) {
        return this.keypair.getPublicKey().toSuiAddress();
      }

      // Check if wallet exists in storage
      const privateKeyB64 = await AsyncStorage.getItem('sui_private_key');
      
      if (privateKeyB64) {
        try {
          const privateKeyBytes = fromB64(privateKeyB64);
          this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
          console.log('✅ Loaded existing wallet');
        } catch (error) {
          console.warn('⚠️ Invalid stored private key, creating new wallet');
          await AsyncStorage.removeItem('sui_private_key');
        }
      }
      
      if (!this.keypair) {
        try {
          // Enhanced keypair generation with better error handling
          this.keypair = new Ed25519Keypair();
          const privateKeyBytes = this.keypair.getSecretKey();
          const privateKeyB64 = toB64(privateKeyBytes);
          await AsyncStorage.setItem('sui_private_key', privateKeyB64);
          console.log('✅ Created new wallet');
        } catch (cryptoError) {
          console.error('❌ Crypto error:', cryptoError);
          
          // Try alternative keypair generation
          try {
            console.log('🔄 Trying alternative keypair generation...');
            // Generate random bytes manually
            const randomBytes = new Uint8Array(32);
            global.crypto.getRandomValues(randomBytes);
            
            this.keypair = Ed25519Keypair.fromSecretKey(randomBytes);
            const privateKeyBytes = this.keypair.getSecretKey();
            const privateKeyB64 = toB64(privateKeyBytes);
            await AsyncStorage.setItem('sui_private_key', privateKeyB64);
            console.log('✅ Created wallet with alternative method');
          } catch (alternativeError) {
            console.error('❌ Alternative crypto method failed:', alternativeError);
            throw new Error('Failed to generate cryptographic keys. Please ensure your device supports secure random number generation.');
          }
        }
      }
      
      this.isInitialized = true;
      const address = this.keypair.getPublicKey().toSuiAddress();
      
      // Load cached object IDs
      await this.loadCachedObjectIds();
      
      console.log(`🚀 Wallet initialized: ${address}`);
      return address;
    } catch (error: any) {
      console.error('❌ Failed to initialize wallet:', error);
      throw new Error(`Failed to initialize wallet: ${error.message}`);
    }
  }

  /**
   * Test crypto functionality
   */
  async testCrypto(): Promise<boolean> {
    try {
      console.log('🧪 Testing crypto functionality...');
      
      // Test random number generation
      const testArray = new Uint8Array(32);
      global.crypto.getRandomValues(testArray);
      
      console.log('✅ Random number generation works');
      
      // Test keypair generation
      const testKeypair = new Ed25519Keypair();
      const testAddress = testKeypair.getPublicKey().toSuiAddress();
      
      console.log('✅ Keypair generation works:', testAddress);
      
      return true;
    } catch (error) {
      console.error('❌ Crypto test failed:', error);
      return false;
    }
  }


  /**
   * Load cached object IDs from storage
   */
  private async loadCachedObjectIds(): Promise<void> {
    try {
      const registryId = await AsyncStorage.getItem('treasure_registry_id');
      const profileId = await AsyncStorage.getItem('hunter_profile_id');
      
      if (registryId) this.treasureRegistryId = registryId;
      if (profileId) this.hunterProfileId = profileId;
      
      console.log('📦 Loaded cached object IDs:', { registryId, profileId });
    } catch (error) {
      console.warn('⚠️ Failed to load cached object IDs:', error);
    }
  }

  /**
   * Find the TreasureRegistry shared object
   */
  private async findTreasureRegistry(): Promise<string> {
    if (this.treasureRegistryId) {
      // Verify the object still exists
      try {
        await this.client.getObject({ id: this.treasureRegistryId });
        return this.treasureRegistryId;
      } catch (error) {
        console.warn('⚠️ Cached registry ID invalid, searching for new one');
        this.treasureRegistryId = null;
      }
    }

    try {
      // Search for shared objects of TreasureRegistry type
      const objects = await this.client.queryEvents({
        query: { MoveModule: { package: this.packageId, module: 'treasure_nft' } },
        limit: 50,
        order: 'ascending'
      });

      // Look for the registry creation event or search owned objects
      // For now, we'll need to implement a registry finder or get it from deployment
      console.log('🔍 Searching for TreasureRegistry...');
      
      // If we can't find it automatically, you'll need to provide it manually
      // This should be the object ID created when you deployed the contract
      throw new Error('TreasureRegistry not found. Please provide the registry object ID manually.');
      
    } catch (error) {
      console.error('❌ Failed to find TreasureRegistry:', error);
      throw error;
    }
  }

  /**
   * Find or create hunter profile
   */
  private async findOrCreateHunterProfile(): Promise<string> {
    if (!this.keypair) {
      throw new Error('Wallet not initialized');
    }

    if (this.hunterProfileId) {
      try {
        await this.client.getObject({ id: this.hunterProfileId });
        return this.hunterProfileId;
      } catch (error) {
        console.warn('⚠️ Cached profile ID invalid, will create new profile');
        this.hunterProfileId = null;
      }
    }

    // Search for existing profile owned by this address
    const address = this.keypair.getPublicKey().toSuiAddress();
    
    try {
      const ownedObjects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${this.packageId}::treasure_nft::HunterProfile`
        },
        options: { showContent: true }
      });

      if (ownedObjects.data && ownedObjects.data.length > 0) {
        const profileId = ownedObjects.data[0].data?.objectId;
        if (profileId) {
          this.hunterProfileId = profileId;
          await AsyncStorage.setItem('hunter_profile_id', profileId);
          console.log('✅ Found existing hunter profile:', profileId);
          return profileId;
        }
      }

      // Create new hunter profile
      return await this.createHunterProfile('TreasureHunter');
      
    } catch (error) {
      console.error('❌ Failed to find or create hunter profile:', error);
      throw error;
    }
  }

  /**
   * Create hunter profile on blockchain
   */
  async createHunterProfile(username: string): Promise<string> {
    if (!this.keypair) {
      await this.initializeWallet();
    }

    try {
      const tx = new Transaction();
      const address = this.keypair!.getPublicKey().toSuiAddress();
      
      tx.setSender(address);
      tx.setGasBudget(20_000_000); // 0.02 SUI

      // Call the create_hunter_profile function
      tx.moveCall({
        target: `${this.packageId}::treasure_nft::create_hunter_profile`,
        arguments: [tx.pure.string(username)],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair!,
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      console.log('✅ Hunter profile created:', result.digest);

      // Extract the profile object ID from the transaction result
      const createdObjects = result.objectChanges?.filter(
        change => change.type === 'created'
      );

      if (createdObjects && createdObjects.length > 0) {
        const profileObject = createdObjects.find(obj => 
          obj.type === 'created' && 
          obj.objectType?.includes('HunterProfile')
        );

        if (profileObject && 'objectId' in profileObject) {
          this.hunterProfileId = profileObject.objectId;
          await AsyncStorage.setItem('hunter_profile_id', profileObject.objectId);
          return profileObject.objectId;
        }
      }

      throw new Error('Failed to extract profile object ID from transaction result');

    } catch (error) {
      console.error('❌ Failed to create hunter profile:', error);
      throw error;
    }
  }

  /**
   * Find treasure and mint NFT - REAL BLOCKCHAIN INTEGRATION
   */
  async findTreasure(treasureId: string, locationProof: string): Promise<TreasureDiscoveryResult> {
    if (!this.keypair) {
      await this.initializeWallet();
    }

    try {
      console.log('🎯 Starting treasure discovery process...');
      
      // Check gas balance
      const balance = await this.getBalanceInSui();
      if (balance < 0.05) {
        throw new Error('Insufficient SUI balance for transaction. Need at least 0.05 SUI for gas.');
      }

      // Get required object IDs
      const registryId = await this.findTreasureRegistry();
      const profileId = await this.findOrCreateHunterProfile();

      console.log('📋 Object IDs:', { registryId, profileId, treasureId });

      const tx = new Transaction();
      const address = this.keypair!.getPublicKey().toSuiAddress();
      
      tx.setSender(address);
      tx.setGasBudget(50_000_000); // 0.05 SUI - higher gas for complex transaction

      // Call the find_treasure function from your smart contract
      tx.moveCall({
        target: `${this.packageId}::treasure_nft::find_treasure`,
        arguments: [
          tx.object(registryId),           // registry: &mut TreasureRegistry
          tx.object(profileId),            // profile: &mut HunterProfile  
          tx.pure.string(treasureId),      // treasure_id: string::String
          tx.pure.string(locationProof),   // location_proof: string::String
          tx.object('0x6'),                // clock: &sui::clock::Clock (system clock)
        ],
      });

      console.log('📡 Executing transaction...');

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair!,
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
          showInput: true,
          showRawInput: false,
        },
      });

      console.log('✅ Transaction executed:', result.digest);

      // Check if transaction was successful
      if (result.effects?.status?.status !== 'success') {
        const error = result.effects?.status?.error || 'Unknown transaction error';
        throw new Error(`Transaction failed: ${error}`);
      }

      // Extract the created NFT object
      const createdObjects = result.objectChanges?.filter(
        change => change.type === 'created'
      ) || [];

      const nftObject = createdObjects.find(obj => 
        obj.type === 'created' && 
        obj.objectType?.includes('TreasureNFT')
      );

      if (!nftObject || !('objectId' in nftObject)) {
        throw new Error('Failed to extract NFT object ID from transaction result');
      }

      // Extract treasure found event data
      const treasureFoundEvent = result.events?.find(event => 
        event.type.includes('TreasureFoundEvent')
      );

      const treasureData = {
        treasureId,
        name: `Treasure ${treasureId}`,
        description: 'A mysterious treasure discovered through blockchain hunting',
        rarity: Math.floor(Math.random() * 3) + 1,
        foundAt: new Date().toISOString(),
        locationProof,
        nftObjectId: nftObject.objectId,
        transactionDigest: result.digest,
        blockHeight: result.checkpoint,
        events: result.events || []
      };

      // Store locally for quick access
      await this.storeTreasureLocally(treasureData);

      console.log('🎉 NFT successfully minted:', {
        objectId: nftObject.objectId,
        digest: result.digest
      });

      return {
        transactionDigest: result.digest,
        nftObjectId: nftObject.objectId,
        treasureData,
        hunterProfileUpdated: true
      };

    } catch (error: any) {
      console.error('❌ Failed to find treasure:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('E_TREASURE_ALREADY_FOUND')) {
        throw new Error('This treasure has already been found by someone else!');
      } else if (error.message?.includes('E_INVALID_LOCATION')) {
        throw new Error('Location verification failed. Make sure you are at the correct location.');
      } else if (error.message?.includes('E_INSUFFICIENT_RANK')) {
        throw new Error('Your hunter rank is too low for this treasure. Keep hunting to level up!');
      } else if (error.message?.includes('E_INVALID_TREASURE_ID')) {
        throw new Error('Invalid treasure ID. This treasure may not exist.');
      }
      
      throw error;
    }
  }

  /**
   * Manually set treasury registry ID (for initial setup)
   */
  async setTreasureRegistryId(registryId: string): Promise<void> {
    this.treasureRegistryId = registryId;
    await AsyncStorage.setItem('treasure_registry_id', registryId);
    console.log('✅ Treasure registry ID set:', registryId);
  }

  /**
   * Store treasure data locally (for demo and caching)
   */
  private async storeTreasureLocally(treasureData: any): Promise<void> {
    try {
      const existingTreasures = await this.getLocalTreasures();
      const updatedTreasures = [...existingTreasures, treasureData];
      await AsyncStorage.setItem('found_treasures', JSON.stringify(updatedTreasures));
    } catch (error) {
      console.error('❌ Failed to store treasure locally:', error);
    }
  }

  /**
   * Get locally stored treasures (for demo purposes)
   */
  private async getLocalTreasures(): Promise<TreasureNFT[]> {
    try {
      const treasuresJson = await AsyncStorage.getItem('found_treasures');
      return treasuresJson ? JSON.parse(treasuresJson) : [];
    } catch (error) {
      console.error('❌ Failed to get local treasures:', error);
      return [];
    }
  }

  /**
   * Get NFTs owned by the wallet - REAL BLOCKCHAIN QUERY
   */
  async getOwnedNFTs(): Promise<any[]> {
    if (!this.keypair) {
      await this.initializeWallet();
    }

    try {
      const address = this.keypair!.getPublicKey().toSuiAddress();
      
      // Query for TreasureNFT objects owned by this address
      const objects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${this.packageId}::treasure_nft::TreasureNFT`,
        },
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
        },
      });

      const nfts = objects.data || [];
      
      // Also get locally stored treasures as fallback
      const localTreasures = await this.getLocalTreasures();
      
      // Combine blockchain NFTs with local data if needed
      console.log(`📦 Found ${nfts.length} NFTs on-chain, ${localTreasures.length} locally`);
      
      return nfts.length > 0 ? nfts : localTreasures;
      
    } catch (error) {
      console.error('❌ Failed to get owned NFTs:', error);
      // Return local treasures as fallback
      return await this.getLocalTreasures();
    }
  }

  /**
   * Get SUI balance with error handling
   */
  async getBalance(): Promise<string> {
    if (!this.keypair) {
      await this.initializeWallet();
    }

    try {
      const address = this.keypair!.getPublicKey().toSuiAddress();
      const balance = await this.client.getBalance({ 
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      return balance.totalBalance;
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return '0';
    }
  }

  /**
   * Get balance in SUI units (not MIST)
   */
  async getBalanceInSui(): Promise<number> {
    const balanceInMist = await this.getBalance();
    return Number(balanceInMist) / Number(MIST_PER_SUI);
  }

  /**
   * Get wallet address
   */
  async getWalletAddress(): Promise<string> {
    if (!this.keypair) {
      await this.initializeWallet();
    }
    return this.keypair!.getPublicKey().toSuiAddress();
  }

  /**
   * Request SUI from faucet (testnet/devnet only)
   */
  async requestSuiFromFaucet(): Promise<boolean> {
    if (this.network === 'mainnet') {
      throw new Error('Faucet not available on mainnet');
    }

    if (!this.keypair) {
      await this.initializeWallet();
    }

    try {
      const address = this.keypair!.getPublicKey().toSuiAddress();
      const faucetUrl = this.network === 'testnet' 
        ? 'https://faucet.testnet.sui.io/gas'
        : 'https://faucet.devnet.sui.io/gas';

      console.log('🚰 Requesting SUI from faucet...');

      const response = await fetch(faucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: address
          }
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Faucet request successful:', result);
        return true;
      } else {
        console.error('❌ Faucet request failed:', result);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Failed to request SUI from faucet:', error);
      return false;
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network,
      rpcUrl: getFullnodeUrl(this.network),
      packageId: this.packageId,
      treasureRegistryId: this.treasureRegistryId,
      hunterProfileId: this.hunterProfileId,
    };
  }

  /**
   * Reset wallet (clear stored keys)
   */
  async resetWallet(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'sui_private_key',
        'found_treasures',
        'treasure_registry_id',
        'hunter_profile_id'
      ]);
      
      this.keypair = null;
      this.isInitialized = false;
      this.treasureRegistryId = null;
      this.hunterProfileId = null;
      
      console.log('✅ Wallet reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset wallet:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(digest: string): Promise<any> {
    try {
      const transaction = await this.client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
          showObjectChanges: true,
        },
      });
      return transaction;
    } catch (error) {
      console.error('❌ Failed to get transaction details:', error);
      throw error;
    }
  }

  /**
   * Check if wallet is initialized
   */
  isWalletInitialized(): boolean {
    return this.isInitialized && this.keypair !== null;
  }

  /**
   * Format SUI amount for display
   */
  formatSuiAmount(amountInMist: string): string {
    const sui = Number(amountInMist) / Number(MIST_PER_SUI);
    return sui.toFixed(4);
  }

  /**
   * Validate Sui address format
   */
  static isValidSuiAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }
}