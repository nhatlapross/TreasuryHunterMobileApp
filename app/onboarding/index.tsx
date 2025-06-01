// app/onboarding/index.tsx - Main onboarding entry point
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function OnboardingIndex() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/onboarding/welcome');
  };

  const handleSkip = () => {
    router.push('/onboarding/permissions'); // Skip to final step
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#ec4899']}
                style={styles.logoGradient}
              >
                <Ionicons name="diamond" size={80} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Welcome to{'\n'}Treasure Hunt!</Text>
            <Text style={styles.subtitle}>
              Discover real-world treasures and earn blockchain rewards
            </Text>
          </View>

          {/* Main illustration area */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationCard}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.illustrationGradient}
              >
                <Ionicons name="map" size={120} color="#fff" />
              </LinearGradient>
              <Text style={styles.illustrationText}>
                Hunt for hidden treasures in the real world
              </Text>
            </View>
          </View>

          {/* Quick features */}
          <View style={styles.featuresPreview}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Ionicons name="qr-code" size={24} color="#6366f1" />
                <Text style={styles.featureText}>Scan QR/NFC</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="trophy" size={24} color="#ec4899" />
                <Text style={styles.featureText}>Earn NFTs</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="wallet" size={24} color="#10b981" />
                <Text style={styles.featureText}>Sui Blockchain</Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip Tutorial</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 30,
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
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  illustrationGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  featuresPreview: {
    paddingVertical: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    paddingTop: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'underline',
  },
});