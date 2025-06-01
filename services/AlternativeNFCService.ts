// services/AlternativeNFCService.ts - Using different NFC library
import { Alert, Platform } from 'react-native';

// Try importing alternative NFC library
let NfcManager: any = null;
let NfcTech: any = null;
let Ndef: any = null;

// First, try the original library
try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default || nfcModule.NfcManager;
  NfcTech = nfcModule.NfcTech;
  Ndef = nfcModule.Ndef;
  console.log('✅ react-native-nfc-manager loaded successfully');
} catch (error) {
  console.warn('❌ react-native-nfc-manager failed to load:', error);
  
  // Try alternative import method
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
  rarity: number;
  coordinates: string;
  location: string;
  imageUrl?: string;
  requiredRank: number;
  rewardPoints: number;
  createdAt: number;
  signature?: string;
}

export class AlternativeNFCService {
  private static isInitialized = false;
  private static debugMode = true;

  private static debugLog(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[AltNFC] ${message}`, ...args);
    }
  }

  /**
   * Check if NFC library is available
   */
  static isLibraryAvailable(): boolean {
    return NfcManager !== null && typeof NfcManager === 'object';
  }

  /**
   * Comprehensive NFC support check with detailed error reporting
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
      
      // Try different methods to check support
      let supported = false;
      let supportError = null;

      // Method 1: Direct isSupported call
      try {
        supported = await NfcManager.isSupported();
        this.debugLog(`Method 1 - isSupported(): ${supported}`);
      } catch (error) {
        this.debugLog('Method 1 failed:', error);
        supportError = error;

        // Method 2: Try starting NFC first, then check
        try {
          this.debugLog('Trying to start NFC manager first...');
          await NfcManager.start();
          supported = await NfcManager.isSupported();
          this.debugLog(`Method 2 - start then isSupported(): ${supported}`);
        } catch (startError) {
          this.debugLog('Method 2 failed:', startError);
          
          // Method 3: Check if methods exist (library compatibility)
          if (typeof NfcManager.isSupported === 'function') {
            this.debugLog('isSupported method exists but throws error');
            return {
              libraryLoaded: true,
              deviceSupported: false,
              nfcEnabled: false,
              error: 'Library compatibility issue',
              details: `NFC methods exist but fail: ${supportError}`
            };
          } else {
            this.debugLog('isSupported method does not exist');
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
      // Try to start NFC manager
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
   * Attempt to read NFC with comprehensive error handling
   */
  static async attemptNFCRead(): Promise<TreasureNFCData | null> {
    this.debugLog('=== Starting NFC read attempt ===');

    // Check availability first
    const availability = await this.checkNFCAvailability();
    this.debugLog('Availability check result:', availability);

    if (!availability.libraryLoaded) {
      throw new Error('NFC library not loaded. Please reinstall react-native-nfc-manager');
    }

    if (!availability.deviceSupported) {
      throw new Error('This device does not support NFC');
    }

    if (!availability.nfcEnabled) {
      throw new Error('NFC is disabled. Please enable NFC in device settings');
    }

    // Initialize if needed
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize NFC');
      }
    }

    try {
      this.debugLog('Requesting NFC technology...');
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      this.debugLog('✅ NFC technology requested');

      // Show user instruction
      Alert.alert(
        'NFC Ready',
        'Hold your phone near the NFC tag now',
        [{ text: 'OK' }]
      );

      this.debugLog('Getting NFC tag...');
      const tag = await NfcManager.getTag();

      if (!tag) {
        throw new Error('No NFC tag detected');
      }

      this.debugLog('✅ NFC tag detected:', tag);

      // Process the tag data
      return this.processNFCTag(tag);

    } catch (error) {
      this.debugLog('❌ NFC read failed:', error);
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

    throw new Error('Unrecognized payload format');
  }

  /**
   * Get detailed diagnostic information
   */
  static async getDiagnostics(): Promise<any> {
    const availability = await this.checkNFCAvailability();
    
    return {
      platform: Platform.OS,
      libraryAvailable: this.isLibraryAvailable(),
      nfcManagerType: typeof NfcManager,
      availability,
      methods: NfcManager ? Object.getOwnPropertyNames(NfcManager) : [],
      isInitialized: this.isInitialized
    };
  }
}