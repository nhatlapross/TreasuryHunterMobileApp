// components/QuickNFCTest.tsx - Quick diagnostic test
import { AlternativeNFCService } from '@/services/AlternativeNFCService';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export const QuickNFCTest: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const runDiagnostics = async () => {
    addLog('=== Running NFC Diagnostics ===');
    
    try {
      const diag = await AlternativeNFCService.getDiagnostics();
      setDiagnostics(diag);
      
      addLog(`Platform: ${diag.platform}`);
      addLog(`Library Available: ${diag.libraryAvailable}`);
      addLog(`NfcManager Type: ${diag.nfcManagerType}`);
      addLog(`Library Loaded: ${diag.availability.libraryLoaded}`);
      addLog(`Device Supported: ${diag.availability.deviceSupported}`);
      addLog(`NFC Enabled: ${diag.availability.nfcEnabled}`);
      
      if (diag.availability.error) {
        addLog(`❌ Error: ${diag.availability.error}`);
        addLog(`Details: ${diag.availability.details}`);
      } else {
        addLog('✅ All checks passed!');
      }
      
      addLog(`Available Methods: ${diag.methods.slice(0, 5).join(', ')}...`);
      
    } catch (error) {
      addLog(`❌ Diagnostics failed: ${error}`);
    }
  };

  const testNFCRead = async () => {
    addLog('=== Testing NFC Read ===');
    
    try {
      const treasureData = await AlternativeNFCService.attemptNFCRead();
      
      if (treasureData) {
        addLog('✅ NFC Read Successful!');
        addLog(`Treasure: ${treasureData.name}`);
        addLog(`ID: ${treasureData.treasureId}`);
        addLog(`Coordinates: ${treasureData.coordinates}`);
        
        Alert.alert(
          'Success!',
          `Found treasure: ${treasureData.name}`,
          [{ text: 'Great!' }]
        );
      } else {
        addLog('❌ No data returned');
      }
    } catch (error) {
      addLog(`❌ NFC Read failed: ${error}`);
      
      Alert.alert(
        'NFC Error',
        `${error}`,
        [{ text: 'OK' }]
      );
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setDiagnostics(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick NFC Test</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={runDiagnostics}>
          <Text style={styles.buttonText}>Run Diagnostics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNFCRead}>
          <Text style={styles.buttonText}>Test NFC Read</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        {diagnostics && (
          <View style={styles.diagnosticsContainer}>
            <Text style={styles.diagnosticsTitle}>Quick Status:</Text>
            <Text style={styles.diagnosticsText}>
              Library: {diagnostics.availability.libraryLoaded ? '✅' : '❌'}
              Device: {diagnostics.availability.deviceSupported ? '✅' : '❌'}
              Enabled: {diagnostics.availability.nfcEnabled ? '✅' : '❌'}
            </Text>
          </View>
        )}

        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    padding: 15,
  },
  diagnosticsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  diagnosticsTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  diagnosticsText: {
    color: '#ccc',
    fontSize: 14,
  },
  logText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});