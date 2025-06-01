// app/onboarding/permissions.tsx - Final permissions screen
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface Permission {
  id: string;
  icon: string;
  title: string;
  description: string;
  required: boolean;
  granted: boolean;
  color: string;
}

export default function OnboardingPermissions() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'location',
      icon: 'location',
      title: 'Location Access',
      description: 'Required to find nearby treasures and verify your position',
      required: true,
      granted: false,
      color: '#6366f1'
    },
    {
      id: 'camera',
      icon: 'camera',
      title: 'Camera Access',
      description: 'Needed to scan QR codes at treasure locations',
      required: true,
      granted: false,
      color: '#ec4899'
    },
    {
      id: 'notifications',
      icon: 'notifications',
      title: 'Notifications',
      description: 'Get notified about nearby treasures and achievements',
      required: false,
      granted: false,
      color: '#10b981'
    }
  ]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const cameraStatus = await Camera.getCameraPermissionsAsync();

      setPermissions(prev => prev.map(permission => {
        switch (permission.id) {
          case 'location':
            return { ...permission, granted: locationStatus.status === 'granted' };
          case 'camera':
            return { ...permission, granted: cameraStatus.status === 'granted' };
          default:
            return permission;
        }
      }));
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermission = async (permissionId: string) => {
    try {
      let result;
      
      switch (permissionId) {
        case 'location':
          result = await Location.requestForegroundPermissionsAsync();
          break;
        case 'camera':
          result = await Camera.requestCameraPermissionsAsync();
          break;
        case 'notifications':
          // Notifications permission would be handled differently
          result = { status: 'granted' };
          break;
        default:
          return;
      }

      setPermissions(prev => prev.map(permission => 
        permission.id === permissionId 
          ? { ...permission, granted: result.status === 'granted' }
          : permission
      ));

      if (result.status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          `${permissions.find(p => p.id === permissionId)?.title} is required for the best treasure hunting experience.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error(`Error requesting ${permissionId} permission:`, error);
    }
  };

  const allRequiredPermissionsGranted = permissions
    .filter(p => p.required)
    .every(p => p.granted);

  const handleContinue = async () => {
    if (!allRequiredPermissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Please grant the required permissions to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Permissions?',
      'You can grant permissions later, but some features may not work properly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            await AsyncStorage.setItem('onboarding_completed', 'true');
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Permissions</Text>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Almost Ready!</Text>
            <Text style={styles.subtitle}>
              Grant permissions for the best treasure hunting experience
            </Text>
          </View>

          {/* Permissions list */}
          <View style={styles.permissionsContainer}>
            {permissions.map((permission) => (
              <View key={permission.id} style={styles.permissionCard}>
                <View style={styles.permissionInfo}>
                  <LinearGradient
                    colors={[permission.color, permission.color + '80']}
                    style={styles.permissionIcon}
                  >
                    <Ionicons name={permission.icon as any} size={24} color="#fff" />
                  </LinearGradient>
                  
                  <View style={styles.permissionText}>
                    <View style={styles.permissionHeader}>
                      <Text style={styles.permissionTitle}>{permission.title}</Text>
                      {permission.required && (
                        <Text style={styles.requiredBadge}>Required</Text>
                      )}
                    </View>
                    <Text style={styles.permissionDescription}>
                      {permission.description}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    permission.granted && styles.permissionButtonGranted
                  ]}
                  onPress={() => requestPermission(permission.id)}
                  disabled={permission.granted}
                >
                  <Ionicons
                    name={permission.granted ? 'checkmark' : 'add'}
                    size={20}
                    color={permission.granted ? '#10b981' : '#fff'}
                  />
                  <Text style={[
                    styles.permissionButtonText,
                    permission.granted && styles.permissionButtonTextGranted
                  ]}>
                    {permission.granted ? 'Granted' : 'Grant'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.infoText}>
              Your privacy is protected. Permissions are only used for treasure hunting features.
            </Text>
          </View>
        </Animated.ScrollView>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !allRequiredPermissionsGranted && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={
                allRequiredPermissionsGranted 
                  ? ['#6366f1', '#8b5cf6'] 
                  : ['#666', '#555']
              }
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Start Hunting!</Text>
              <Ionicons name="diamond" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  permissionsContainer: {
    marginBottom: 30,
    gap: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionText: {
    flex: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 100,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionButtonGranted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#10b981',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  permissionButtonTextGranted: {
    color: '#10b981',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#10b981',
    lineHeight: 18,
  },
  bottomActions: {
    padding: 20,
    paddingBottom: 30,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    shadowColor: '#666',
    shadowOpacity: 0.1,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});