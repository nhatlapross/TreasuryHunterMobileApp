// services/NFCService.ts - Fixed version with proper error handling
import { Platform } from 'react-native';

// Try importing NFC library with multiple methods
let NfcManager: any = null;
let NfcTech: any = null;
let Ndef: any = null;

try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default || nfcModule.NfcManager;
  NfcTech = nfcModule.NfcTech;
  Ndef = nfcModule.Ndef;
  console.log('✅ react-native-nfc-manager loaded successfully');
} catch (error) {
  console.warn('❌ react-native-nfc-manager failed to load:', error);
  
  try {
    NfcManager = require('react-native-nfc-manager').default;
    NfcTech = require('react-native-nfc-manager').NfcTech;
    Ndef = require('react-native-nfc-manager').Ndef;
    console.log('✅ react-native-nfc-manager loaded with alternative method');
  } catch (altError) {
    console.error('❌ All NFC import methods failed:', altError);
  }
}

export interface TreasureNFCData {
  treasureId: string;
  name: string;
  description: string;
  rarity: number; // 1=Common, 2=Rare, 3=Legendary
  coordinates: string; // "lat,lng"
  location: string; // Human readable location
  imageUrl?: string;
  requiredRank: number; // 1=Beginner, 2=Explorer, 3=Hunter, 4=Master
  rewardPoints: number;
  createdAt: number; // timestamp
  signature?: string; // Optional verification signature
}

export interface QRTreasureData {
  type: 'treasure_hunt_qr';
  version: '1.0';
  data: TreasureNFCData;
}

export interface NFCReadProgress {
  status: 'initializing' | 'requesting' | 'scanning' | 'processing' | 'success' | 'error';
  message: string;
  progress?: number;
}

export class NFCService {
  private static isInitialized = false;
  private static debugMode = true;

  private static debugLog(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[NFCService] ${message}`, ...args);
    }
  }

  /**
   * Check if NFC library is available
   */
  static isLibraryAvailable(): boolean {
    return NfcManager !== null && typeof NfcManager === 'object';
  }

  /**
   * Comprehensive NFC support check
   */
  static async checkNFCAvailability(): Promise<{
    libraryLoaded: boolean;
    deviceSupported: boolean;
    nfcEnabled: boolean;
    error?: string;
    details: string;
  }> {
    this.debugLog('Starting comprehensive NFC availability check...');

    // Check 1: Library loaded
    if (!this.isLibraryAvailable()) {
      return {
        libraryLoaded: false,
        deviceSupported: false,
        nfcEnabled: false,
        error: 'NFC library not loaded',
        details: 'react-native-nfc-manager failed to import. Check installation.'
      };
    }

    this.debugLog('✅ NFC library is loaded');

    // Check 2: Platform support
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return {
        libraryLoaded: true,
        deviceSupported: false,
        nfcEnabled: false,
        error: 'Unsupported platform',
        details: `Platform ${Platform.OS} is not supported for NFC`
      };
    }

    this.debugLog(`✅ Platform ${Platform.OS} supports NFC`);

    // Check 3: Device hardware support
    try {
      this.debugLog('Checking device NFC support...');
      
      let supported = false;
      let supportError = null;

      try {
        supported = await NfcManager.isSupported();
        this.debugLog(`Device NFC support: ${supported}`);
      } catch (error) {
        this.debugLog('Support check failed, trying alternative:', error);
        supportError = error;

        try {
          this.debugLog('Trying to start NFC manager first...');
          await NfcManager.start();
          supported = await NfcManager.isSupported();
          this.debugLog(`Alternative method result: ${supported}`);
        } catch (startError) {
          this.debugLog('Alternative method failed:', startError);
          
          if (typeof NfcManager.isSupported === 'function') {
            return {
              libraryLoaded: true,
              deviceSupported: false,
              nfcEnabled: false,
              error: 'Library compatibility issue',
              details: `NFC methods exist but fail: ${supportError}`
            };
          } else {
            return {
              libraryLoaded: true,
              deviceSupported: false,
              nfcEnabled: false,
              error: 'Incomplete library',
              details: 'NFC library missing required methods'
            };
          }
        }
      }

      if (!supported) {
        return {
          libraryLoaded: true,
          deviceSupported: false,
          nfcEnabled: false,
          error: 'Hardware not supported',
          details: 'Device does not have NFC hardware'
        };
      }

      this.debugLog('✅ Device supports NFC hardware');

      // Check 4: NFC enabled status
      try {
        const enabled = await NfcManager.isEnabled();
        this.debugLog(`NFC enabled: ${enabled}`);

        return {
          libraryLoaded: true,
          deviceSupported: true,
          nfcEnabled: enabled,
          details: enabled ? 'NFC is ready' : 'NFC is disabled in settings'
        };

      } catch (enabledError) {
        this.debugLog('Failed to check if NFC is enabled:', enabledError);
        
        return {
          libraryLoaded: true,
          deviceSupported: true,
          nfcEnabled: false,
          error: 'Cannot check NFC status',
          details: `Failed to determine if NFC is enabled: ${enabledError}`
        };
      }

    } catch (error) {
      this.debugLog('Comprehensive check failed:', error);
      
      return {
        libraryLoaded: true,
        deviceSupported: false,
        nfcEnabled: false,
        error: 'Check failed',
        details: `NFC availability check failed: ${error}`
      };
    }
  }

  /**
   * Initialize NFC with robust error handling
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      this.debugLog('NFC already initialized');
      return true;
    }

    this.debugLog('Initializing NFC...');

    const availability = await this.checkNFCAvailability();
    
    if (!availability.libraryLoaded) {
      this.debugLog('❌ Library not loaded');
      return false;
    }

    if (!availability.deviceSupported) {
      this.debugLog('❌ Device not supported');
      return false;
    }

    try {
      await NfcManager.start();
      this.isInitialized = true;
      this.debugLog('✅ NFC initialized successfully');
      return true;
    } catch (error) {
      this.debugLog('❌ Failed to initialize NFC:', error);
      return false;
    }
  }

  /**
   * Read NFC with progress callbacks
   */
  static async readTreasureFromNFC(
    onProgress?: (progress: NFCReadProgress) => void
  ): Promise<TreasureNFCData | null> {
    try {
      this.debugLog('=== Starting NFC read operation ===');
      
      // Step 1: Initialize
      onProgress?.({
        status: 'initializing',
        message: 'Checking NFC availability...',
        progress: 10
      });

      const availability = await this.checkNFCAvailability();
      this.debugLog('NFC availability check result:', availability);
      
      if (!availability.libraryLoaded) {
        throw new Error('NFC library not loaded. Please reinstall react-native-nfc-manager');
      }

      if (!availability.deviceSupported) {
        throw new Error('This device does not support NFC');
      }

      if (!availability.nfcEnabled) {
        throw new Error('NFC is disabled. Please enable NFC in device settings');
      }

      // Step 2: Initialize if needed
      onProgress?.({
        status: 'initializing',
        message: 'Initializing NFC...',
        progress: 20
      });

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize NFC');
        }
      }

      // Step 3: Request technology
      onProgress?.({
        status: 'requesting',
        message: 'Requesting NFC technology...',
        progress: 30
      });

      this.debugLog('Requesting NFC technology...');
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      this.debugLog('✅ NFC technology requested');

      // Step 4: Start scanning
      onProgress?.({
        status: 'scanning',
        message: 'Hold your phone near the NFC tag...',
        progress: 50
      });

      this.debugLog('Getting NFC tag...');
      const tag = await NfcManager.getTag();

      if (!tag) {
        throw new Error('No NFC tag detected');
      }

      this.debugLog('✅ NFC tag detected:', tag);

      // Step 5: Process data
      onProgress?.({
        status: 'processing',
        message: 'Processing treasure data...',
        progress: 80
      });

      const treasureData = this.processNFCTag(tag);

      // Step 6: Success
      onProgress?.({
        status: 'success',
        message: 'Treasure discovered!',
        progress: 100
      });

      return treasureData;

    } catch (error) {
      this.debugLog('❌ NFC read failed:', error);
      
      onProgress?.({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown NFC error',
        progress: 0
      });

      throw error;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
        this.debugLog('NFC request cancelled');
      } catch (cancelError) {
        this.debugLog('Cancel error:', cancelError);
      }
    }
  }

  /**
   * Process NFC tag data
   */
  static processNFCTag(tag: any): TreasureNFCData {
    this.debugLog('Processing NFC tag:', tag);

    if (!tag.ndefMessage || tag.ndefMessage.length === 0) {
      throw new Error('No NDEF data found on tag');
    }

    const record = tag.ndefMessage[0];
    
    if (!record.payload) {
      throw new Error('No payload in NDEF record');
    }

    // Try to decode payload
    let payloadString: string;
    
    try {
      // Try standard text decoding
      const payloadBytes = new Uint8Array(record.payload);
      payloadString = Ndef.text.decodePayload(payloadBytes);
      this.debugLog('✅ Decoded with standard method:', payloadString);
    } catch (error) {
      this.debugLog('Standard decoding failed, trying alternatives...');
      
      // Try UTF-8 decoding with different skip values
      for (let skip = 0; skip <= 5; skip++) {
        try {
          const textBytes = record.payload.slice(skip);
          const decoded = new TextDecoder('utf-8').decode(new Uint8Array(textBytes));
          
          if (decoded.includes('treasure_name') || decoded.includes('{')) {
            payloadString = decoded;
            this.debugLog(`✅ Decoded with skip ${skip}:`, payloadString);
            break;
          }
        } catch (decodeError) {
          // Continue trying
        }
      }
      
      if (!payloadString) {
        throw new Error('Failed to decode NFC payload');
      }
    }

    // Parse treasure data
    return this.parseTreasureFromPayload(payloadString);
  }

  /**
   * Parse treasure data from payload string
   */
  static parseTreasureFromPayload(payloadString: string): TreasureNFCData {
    this.debugLog('Parsing treasure from payload:', payloadString);

    // Handle your specific format
    if (payloadString.includes('treasure_name') && payloadString.includes('nfc_data')) {
      try {
        const data = JSON.parse(payloadString);
        const nfcData = JSON.parse(data.nfc_data);
        
        return {
          treasureId: nfcData.id || 'unknown',
          name: data.treasure_name,
          description: 'Treasure discovered via NFC',
          rarity: 2,
          coordinates: `${nfcData.lat},${nfcData.lng}`,
          location: data.treasure_name,
          requiredRank: 1,
          rewardPoints: 250,
          createdAt: nfcData.t ? nfcData.t * 1000 : Date.now(),
          signature: nfcData.h
        };
      } catch (parseError) {
        throw new Error(`Failed to parse treasure format: ${parseError}`);
      }
    }

    // Try standard QR format
    try {
      const parsed: QRTreasureData = JSON.parse(payloadString);
      
      if (parsed.type === 'treasure_hunt_qr' && parsed.data) {
        return parsed.data;
      }
    } catch (parseError) {
      // Continue to error
    }

    throw new Error('Unrecognized payload format');
  }

  /**
   * Start NFC session with progress - FIXED VERSION
   */
  static async startNFCSessionWithProgress(
    onProgress?: (progress: NFCReadProgress) => void
  ): Promise<TreasureNFCData | null> {
    try {
      this.debugLog('Starting NFC session with progress...');
      
      // FIXED: Use correct property names
      const nfcCheck = await this.checkNFCAvailability();
      
      if (!nfcCheck.deviceSupported) { // FIXED: was nfcCheck.supported
        throw new Error(nfcCheck.details);
      }

      if (!nfcCheck.nfcEnabled) { // FIXED: this was correct
        throw new Error(nfcCheck.details);
      }

      return await this.readTreasureFromNFC(onProgress);

    } catch (error) {
      this.debugLog('NFC session error:', error);
      
      onProgress?.({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown NFC error'
      });
      
      throw error;
    }
  }

  /**
   * Legacy method for compatibility
   */
  static async readNFCTag(): Promise<string | null> {
    try {
      const treasureData = await this.readTreasureFromNFC();
      if (treasureData) {
        return JSON.stringify({
          treasureId: treasureData.treasureId,
          coordinates: treasureData.coordinates
        });
      }
      return null;
    } catch (error) {
      this.debugLog('Legacy readNFCTag failed:', error);
      return null;
    }
  }

  /**
   * Generate QR code data (same format as NFC for consistency)
   */
  static generateQRData(treasureData: TreasureNFCData): string {
    const payload: QRTreasureData = {
      type: 'treasure_hunt_qr',
      version: '1.0',
      data: treasureData
    };
    return JSON.stringify(payload);
  }

  /**
   * Parse QR code data
   */
  static parseQRData(qrString: string): TreasureNFCData {
    try {
      const parsed: QRTreasureData = JSON.parse(qrString);
      
      if (parsed.type !== 'treasure_hunt_qr' || !parsed.data) {
        throw new Error('Invalid QR treasure data format');
      }

      return parsed.data;
    } catch (error) {
      throw new Error(`Invalid QR data: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  /**
   * Get rarity display info
   */
  static getRarityInfo(rarity: number) {
    switch (rarity) {
      case 3:
        return { name: 'Legendary', color: '#ffd700', emoji: '💎' };
      case 2:
        return { name: 'Rare', color: '#c084fc', emoji: '💜' };
      case 1:
        return { name: 'Common', color: '#10b981', emoji: '💚' };
      default:
        return { name: 'Unknown', color: '#6b7280', emoji: '❓' };
    }
  }

  /**
   * Get rank display info
   */
  static getRankInfo(rank: number) {
    switch (rank) {
      case 4:
        return { name: 'Master Hunter', color: '#f59e0b', emoji: '🏆' };
      case 3:
        return { name: 'Hunter', color: '#8b5cf6', emoji: '🎯' };
      case 2:
        return { name: 'Explorer', color: '#3b82f6', emoji: '🧭' };
      case 1:
        return { name: 'Beginner', color: '#10b981', emoji: '🌟' };
      default:
        return { name: 'Unknown', color: '#6b7280', emoji: '❓' };
    }
  }

  /**
   * Enable/disable debug mode
   */
  static setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    this.debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Cleanup NFC resources
   */
  static async cleanup(): Promise<void> {
    try {
      if (this.isInitialized) {
        this.debugLog('Cleaning up NFC resources...');
        
        try {
          await NfcManager.unregisterTagEvent();
          this.debugLog('Unregistered tag events');
        } catch (error) {
          this.debugLog('Failed to unregister tag event:', error);
        }
        
        try {
          await NfcManager.cancelTechnologyRequest();
          this.debugLog('Cancelled technology request');
        } catch (error) {
          this.debugLog('Failed to cancel technology request:', error);
        }
        
        this.isInitialized = false;
        this.debugLog('NFC Manager cleaned up successfully');
      }
    } catch (error) {
      this.debugLog('Failed to cleanup NFC:', error);
    }
  }
}