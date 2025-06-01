// app/index.tsx - Entry point with navigation logic
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      checkNavigationFlow();
    }
  }, [isInitialized, isAuthenticated, user]);

  const checkNavigationFlow = async () => {
    try {
      console.log('🧭 Checking navigation flow...');
      console.log('🔐 Is authenticated:', isAuthenticated);
      console.log('👤 User:', user?.username);

      // Wait a bit for splash screen effect
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!isAuthenticated) {
        console.log('📱 Navigating to login screen');
        router.replace('/auth/google-login');
        return;
      }

      // Check if user has completed onboarding
      const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding_completed');
      console.log('🎯 Onboarding completed:', !!hasCompletedOnboarding);

      if (!hasCompletedOnboarding) {
        console.log('📚 Navigating to onboarding');
        router.replace('/onboarding');
        return;
      }

      // User is authenticated and has completed onboarding
      console.log('🏠 Navigating to main app');
      router.replace('/(tabs)');

    } catch (error) {
      console.error('❌ Navigation check error:', error);
      // Fallback to login on error
      router.replace('/auth/google-login');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#ec4899']}
            style={styles.logoGradient}
          >
            <Ionicons name="diamond" size={60} color="#fff" />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Treasure Hunt</Text>
        <Text style={styles.subtitle}>
          Discover hidden treasures with blockchain rewards
        </Text>

        {/* Loading indicator */}
        {isChecking && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            <Text style={styles.loadingText}>
              {!isInitialized ? 'Initializing...' : 
               !isAuthenticated ? 'Checking authentication...' : 
               'Loading your adventure...'}
            </Text>
          </View>
        )}

        {/* Features preview */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="search" size={24} color="#6366f1" />
            <Text style={styles.featureText}>Scan QR & NFC</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="trophy" size={24} color="#ec4899" />
            <Text style={styles.featureText}>Earn NFT Rewards</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="people" size={24} color="#8b5cf6" />
            <Text style={styles.featureText}>Compete & Share</Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
  },
  features: {
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
  },
});

