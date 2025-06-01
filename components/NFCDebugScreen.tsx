// components/NFCDebugScreen.tsx - Comprehensive NFC Debug Tool
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export const NFCDebugScreen: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [nfcStatus, setNfcStatus] = useState<string>('Unknown');
  const [isScanning, setIsScanning] = useState(false);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, level, message }]);
    console.log(`[NFC Debug ${level.toUpperCase()}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkNFCStatus = async () => {
    try {
      addLog('=== NFC Status Check Starting ===', 'info');
      addLog(`Platform: ${Platform.OS}`, 'info');
      
      const isSupported = await NfcManager.isSupported();
      addLog(`NFC Supported: ${isSupported}`, isSupported ? 'success' : 'error');
      
      if (isSupported) {
        try {
          await NfcManager.start();
          addLog('NFC Manager started successfully', 'success');
          
          const isEnabled = await NfcManager.isEnabled();
          addLog(`NFC Enabled: ${isEnabled}`, isEnabled ? 'success' : 'warn');
          
          setNfcStatus(isEnabled ? 'Ready' : 'Disabled');
        } catch (startError) {
          addLog(`NFC Start Error: ${startError}`, 'error');
          setNfcStatus('Error');
        }
      } else {
        setNfcStatus('Not Supported');
      }
    } catch (error) {
      addLog(`Status Check Error: ${error}`, 'error');
      setNfcStatus('Error');
    }
  };

  const testRawNFCRead = async () => {
    if (isScanning) {
      addLog('Already scanning, please wait...', 'warn');
      return;
    }

    setIsScanning(true);
    
    try {
      addLog('=== Starting Raw NFC Read Test ===', 'info');
      
      // Request NFC technology
      addLog('Requesting NFC technology...', 'info');
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      addLog('NFC technology requested successfully', 'success');
      
      // Show alert to user
      Alert.alert(
        'NFC Ready',
        'Hold your phone near the NFC tag now',
        [{ text: 'OK' }]
      );
      
      // Wait a moment for user to position phone
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get tag
      addLog('Attempting to read NFC tag...', 'info');
      const tag = await NfcManager.getTag();
      
      if (!tag) {
        throw new Error('No NFC tag detected');
      }
      
      addLog('NFC Tag detected!', 'success');
      addLog(`Tag ID: ${tag.id || 'Unknown'}`, 'info');
      addLog(`Tag Type: ${tag.type || 'Unknown'}`, 'info');
      addLog(`Tech Types: ${tag.techTypes?.join(', ') || 'Unknown'}`, 'info');
      addLog(`Max Size: ${tag.maxSize || 'Unknown'}`, 'info');
      
      // Check NDEF message
      if (!tag.ndefMessage || tag.ndefMessage.length === 0) {
        addLog('No NDEF message found on tag', 'error');
        return;
      }
      
      addLog(`NDEF Message found with ${tag.ndefMessage.length} record(s)`, 'success');
      
      // Process each NDEF record
      tag.ndefMessage.forEach((record, index) => {
        addLog(`=== NDEF Record ${index + 1} ===`, 'info');
        addLog(`TNF: ${record.tnf}`, 'info');
        addLog(`Type: ${record.type}`, 'info');
        addLog(`ID: ${record.id}`, 'info');
        addLog(`Payload Length: ${record.payload?.length || 0}`, 'info');
        
        if (record.payload && record.payload.length > 0) {
          // Show raw payload
          const payloadArray = Array.from(record.payload);
          addLog(`Raw Payload: [${payloadArray.join(', ')}]`, 'info');
          
          // Show hex representation
          const hexString = payloadArray.map(b => b.toString(16).padStart(2, '0')).join(' ');
          addLog(`Hex Payload: ${hexString}`, 'info');
          
          // Test all decoding strategies
          testAllDecodingStrategies(record.payload, index + 1);
        } else {
          addLog('No payload in this record', 'warn');
        }
      });
      
    } catch (error) {
      addLog(`NFC Read Error: ${error}`, 'error');
      
      // Show detailed error info
      if (error instanceof Error) {
        addLog(`Error Name: ${error.name}`, 'error');
        addLog(`Error Message: ${error.message}`, 'error');
        if (error.stack) {
          addLog(`Error Stack: ${error.stack.substring(0, 200)}...`, 'error');
        }
      }
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
        addLog('NFC request cancelled', 'info');
      } catch (cancelError) {
        addLog(`Cancel error: ${cancelError}`, 'warn');
      }
      setIsScanning(false);
    }
  };

  const testAllDecodingStrategies = (payload: number[], recordIndex: number) => {
    addLog(`=== Testing Decoding Strategies for Record ${recordIndex} ===`, 'info');
    
    // Strategy 1: Standard Ndef.text.decodePayload
    try {
      const payloadBytes = new Uint8Array(payload);
      const decoded = Ndef.text.decodePayload(payloadBytes);
      addLog(`✅ Strategy 1 (Ndef.text): "${decoded}"`, 'success');
      
      // Try to parse as JSON
      if (decoded.trim().startsWith('{')) {
        try {
          const jsonData = JSON.parse(decoded);
          addLog(`✅ Strategy 1 JSON Parse Success: ${JSON.stringify(jsonData, null, 2)}`, 'success');
          
          // Check if it matches your format
          if (jsonData.treasure_name && jsonData.nfc_data) {
            addLog('🎯 Found treasure format in Strategy 1!', 'success');
            parseYourFormat(jsonData);
          }
        } catch (jsonError) {
          addLog(`❌ Strategy 1 JSON Parse Failed: ${jsonError}`, 'warn');
        }
      }
    } catch (error) {
      addLog(`❌ Strategy 1 failed: ${error}`, 'warn');
    }

    // Strategy 2: UTF-8 skip 3 bytes (language code)
    try {
      const textBytes = payload.slice(3);
      const decoded = new TextDecoder('utf-8').decode(new Uint8Array(textBytes));
      addLog(`✅ Strategy 2 (UTF-8 skip 3): "${decoded}"`, 'success');
      
      if (decoded.trim().startsWith('{')) {
        try {
          const jsonData = JSON.parse(decoded);
          addLog(`✅ Strategy 2 JSON Parse Success: ${JSON.stringify(jsonData, null, 2)}`, 'success');
          
          if (jsonData.treasure_name && jsonData.nfc_data) {
            addLog('🎯 Found treasure format in Strategy 2!', 'success');
            parseYourFormat(jsonData);
          }
        } catch (jsonError) {
          addLog(`❌ Strategy 2 JSON Parse Failed: ${jsonError}`, 'warn');
        }
      }
    } catch (error) {
      addLog(`❌ Strategy 2 failed: ${error}`, 'warn');
    }

    // Strategy 3: Full UTF-8
    try {
      const decoded = new TextDecoder('utf-8').decode(new Uint8Array(payload));
      addLog(`✅ Strategy 3 (Full UTF-8): "${decoded}"`, 'success');
      
      if (decoded.trim().includes('{')) {
        const jsonStart = decoded.indexOf('{');
        const jsonPart = decoded.substring(jsonStart);
        try {
          const jsonData = JSON.parse(jsonPart);
          addLog(`✅ Strategy 3 JSON Parse Success: ${JSON.stringify(jsonData, null, 2)}`, 'success');
          
          if (jsonData.treasure_name && jsonData.nfc_data) {
            addLog('🎯 Found treasure format in Strategy 3!', 'success');
            parseYourFormat(jsonData);
          }
        } catch (jsonError) {
          addLog(`❌ Strategy 3 JSON Parse Failed: ${jsonError}`, 'warn');
        }
      }
    } catch (error) {
      addLog(`❌ Strategy 3 failed: ${error}`, 'warn');
    }

    // Strategy 4: Character codes
    try {
      const decoded = String.fromCharCode.apply(null, Array.from(payload));
      addLog(`✅ Strategy 4 (Char codes): "${decoded}"`, 'success');
      
      if (decoded.trim().includes('{')) {
        const jsonStart = decoded.indexOf('{');
        const jsonPart = decoded.substring(jsonStart);
        try {
          const jsonData = JSON.parse(jsonPart);
          addLog(`✅ Strategy 4 JSON Parse Success: ${JSON.stringify(jsonData, null, 2)}`, 'success');
          
          if (jsonData.treasure_name && jsonData.nfc_data) {
            addLog('🎯 Found treasure format in Strategy 4!', 'success');
            parseYourFormat(jsonData);
          }
        } catch (jsonError) {
          addLog(`❌ Strategy 4 JSON Parse Failed: ${jsonError}`, 'warn');
        }
      }
    } catch (error) {
      addLog(`❌ Strategy 4 failed: ${error}`, 'warn');
    }

    // Strategy 5: Manual text record parsing
    try {
      if (payload.length > 3) {
        const statusByte = payload[0];
        const languageLength = statusByte & 0x3F;
        const encoding = (statusByte & 0x80) ? 'utf-16' : 'utf-8';
        
        addLog(`Status byte: 0x${statusByte.toString(16)}, Language length: ${languageLength}, Encoding: ${encoding}`, 'info');
        
        const textStart = 1 + languageLength;
        const textBytes = payload.slice(textStart);
        
        const decoded = new TextDecoder(encoding).decode(new Uint8Array(textBytes));
        addLog(`✅ Strategy 5 (Manual): "${decoded}"`, 'success');
        
        if (decoded.trim().startsWith('{')) {
          try {
            const jsonData = JSON.parse(decoded);
            addLog(`✅ Strategy 5 JSON Parse Success: ${JSON.stringify(jsonData, null, 2)}`, 'success');
            
            if (jsonData.treasure_name && jsonData.nfc_data) {
              addLog('🎯 Found treasure format in Strategy 5!', 'success');
              parseYourFormat(jsonData);
            }
          } catch (jsonError) {
            addLog(`❌ Strategy 5 JSON Parse Failed: ${jsonError}`, 'warn');
          }
        }
      }
    } catch (error) {
      addLog(`❌ Strategy 5 failed: ${error}`, 'warn');
    }

    // Strategy 6: Skip different byte counts
    for (let skip = 1; skip <= 10; skip++) {
      try {
        const textBytes = payload.slice(skip);
        const decoded = new TextDecoder('utf-8').decode(new Uint8Array(textBytes));
        
        if (decoded.trim().startsWith('{')) {
          addLog(`✅ Strategy 6.${skip} (Skip ${skip} bytes): "${decoded}"`, 'success');
          
          try {
            const jsonData = JSON.parse(decoded);
            addLog(`✅ Strategy 6.${skip} JSON Parse Success: ${JSON.stringify(jsonData, null, 2)}`, 'success');
            
            if (jsonData.treasure_name && jsonData.nfc_data) {
              addLog(`🎯 Found treasure format in Strategy 6.${skip}!`, 'success');
              parseYourFormat(jsonData);
              break; // Found it, stop trying
            }
          } catch (jsonError) {
            // Don't log JSON parse failures for this strategy to reduce noise
          }
        }
      } catch (error) {
        // Don't log failures for this strategy to reduce noise
      }
    }
  };

  const parseYourFormat = (data: any) => {
    try {
      addLog('=== Parsing Your Treasure Format ===', 'info');
      
      if (!data.treasure_name || !data.nfc_data) {
        throw new Error('Missing treasure_name or nfc_data');
      }

      const nfcData = JSON.parse(data.nfc_data);
      addLog(`NFC Data: ${JSON.stringify(nfcData, null, 2)}`, 'info');
      
      const treasureData = {
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

      addLog(`🎉 Successfully parsed treasure data: ${JSON.stringify(treasureData, null, 2)}`, 'success');
      
      Alert.alert(
        'Treasure Found!',
        `Successfully parsed: ${treasureData.name}\nID: ${treasureData.treasureId}\nCoordinates: ${treasureData.coordinates}`,
        [{ text: 'Great!' }]
      );
      
    } catch (error) {
      addLog(`Failed to parse your format: ${error}`, 'error');
    }
  };

  const testYourNFCService = async () => {
    try {
      addLog('=== Testing Your NFCService ===', 'info');
      
      // Import your service
      const { NFCService } = require('@/services/NFCService');
      
      const treasureData = await NFCService.readTreasureFromNFC();
      
      if (treasureData) {
        addLog(`✅ NFCService Success: ${JSON.stringify(treasureData, null, 2)}`, 'success');
      } else {
        addLog('❌ NFCService returned null', 'error');
      }
    } catch (error) {
      addLog(`❌ NFCService error: ${error}`, 'error');
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      default: return '#ccc';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warn': return 'warning';
      default: return 'information-circle';
    }
  };

  useEffect(() => {
    checkNFCStatus();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NFC Debug Tool</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.status, { 
            color: nfcStatus === 'Ready' ? '#10b981' : 
                   nfcStatus === 'Error' ? '#ef4444' : '#f59e0b' 
          }]}>
            {nfcStatus}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={checkNFCStatus}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.buttonText}>Check Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isScanning && styles.buttonDisabled]} 
          onPress={testRawNFCRead}
          disabled={isScanning}
        >
          <Ionicons name="scan" size={16} color="#fff" />
          <Text style={styles.buttonText}>
            {isScanning ? 'Scanning...' : 'Raw NFC Read'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testYourNFCService}>
          <Ionicons name="code" size={16} color="#fff" />
          <Text style={styles.buttonText}>Test Service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer} contentContainerStyle={styles.logContent}>
        {logs.map((log, index) => (
          <View key={index} style={[styles.logItem, { borderLeftColor: getLogColor(log.level) }]}>
            <View style={styles.logHeader}>
              <Ionicons 
                name={getLogIcon(log.level) as any} 
                size={12} 
                color={getLogColor(log.level)} 
              />
              <Text style={styles.logTimestamp}>{log.timestamp}</Text>
              <Text style={[styles.logLevel, { color: getLogColor(log.level) }]}>
                {log.level.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
        
        {logs.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color="#666" />
            <Text style={styles.emptyText}>No logs yet. Start testing!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#888',
    marginRight: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    minWidth: '45%',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    margin: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  logContent: {
    padding: 15,
  },
  logItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  logTimestamp: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  logLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  logMessage: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
});