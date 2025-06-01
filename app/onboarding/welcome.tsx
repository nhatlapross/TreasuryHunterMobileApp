// app/onboarding/welcome.tsx - Welcome screen explaining the game
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

const { width } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

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

  const handleNext = () => {
    router.push('/onboarding/tutorial');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>How It Works</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.ScrollView
          style={[
            styles.scrollView,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Real-World{'\n'}Treasure Hunting</Text>
            <Text style={styles.subtitle}>
              Explore your city and discover hidden digital treasures
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                style={styles.featureIcon}
              >
                <Ionicons name="location" size={32} color="#fff" />
              </LinearGradient>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Explore Locations</Text>
                <Text style={styles.featureDescription}>
                  Visit real-world locations marked on your map to find hidden treasures
                </Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#ec4899', '#be185d']}
                style={styles.featureIcon}
              >
                <Ionicons name="qr-code" size={32} color="#fff" />
              </LinearGradient>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Scan to Discover</Text>
                <Text style={styles.featureDescription}>
                  Use QR codes or NFC tags at treasure locations to claim your rewards
                </Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#10b981', '#047857']}
                style={styles.featureIcon}
              >
                <Ionicons name="trophy" size={32} color="#fff" />
              </LinearGradient>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Earn NFT Rewards</Text>
                <Text style={styles.featureDescription}>
                  Each discovery mints a unique NFT stored on the Sui blockchain
                </Text>
              </View>
            </View>

            {/* Feature 4 */}
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.featureIcon}
              >
                <Ionicons name="people" size={32} color="#fff" />
              </LinearGradient>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Compete & Rank Up</Text>
                <Text style={styles.featureDescription}>
                  Climb the leaderboard and unlock new hunter ranks
                </Text>
              </View>
            </View>
          </View>

          {/* Blockchain info */}
          <View style={styles.blockchainInfo}>
            <LinearGradient
              colors={['#1a1a1a', '#2a2a2a']}
              style={styles.blockchainCard}
            >
              <View style={styles.blockchainHeader}>
                <Ionicons name="diamond" size={24} color="#6366f1" />
                <Text style={styles.blockchainTitle}>Powered by Sui Blockchain</Text>
              </View>
              <Text style={styles.blockchainDescription}>
                Your treasures are real NFTs on the Sui blockchain. Each discovery is permanently recorded and truly yours!
              </Text>
            </LinearGradient>
          </View>
        </Animated.ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 0,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  blockchainInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  blockchainCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blockchainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockchainTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
    letterSpacing: -0.2,
  },
  blockchainDescription: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  bottomActions: {
    padding: 20,
    paddingBottom: 30,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});