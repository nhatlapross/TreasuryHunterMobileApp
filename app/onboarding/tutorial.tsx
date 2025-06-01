// app/onboarding/tutorial.tsx - Interactive tutorial screen
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

const tutorialSteps = [
  {
    id: 1,
    icon: 'map-outline',
    title: 'Find Treasures',
    description: 'Look for treasure locations on your map. They appear as colored pins based on rarity.',
    color: '#6366f1',
    tip: 'Tip: Start with Common (green) treasures if you\'re a beginner!'
  },
  {
    id: 2,
    icon: 'walk-outline',
    title: 'Visit Location',
    description: 'Navigate to the treasure location in the real world. You need to be within 100 meters.',
    color: '#ec4899',
    tip: 'Tip: Use the distance indicator to know how close you are!'
  },
  {
    id: 3,
    icon: 'qr-code-outline',
    title: 'Scan Code',
    description: 'Use the in-app scanner to scan QR codes or tap NFC tags at the location.',
    color: '#10b981',
    tip: 'Tip: Look for QR codes on signs, stickers, or hidden objects!'
  },
  {
    id: 4,
    icon: 'trophy-outline',
    title: 'Claim Reward',
    description: 'Your discovery is recorded on the blockchain and you receive a unique NFT!',
    color: '#f59e0b',
    tip: 'Tip: Rarer treasures give more points and cooler NFTs!'
  }
];

export default function OnboardingTutorial() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    animateStep();
  }, [currentStep]);

  const animateStep = () => {
    slideAnim.setValue(50);
    fadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/onboarding/permissions');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/permissions');
  };

  const step = tutorialSteps[currentStep];

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
          <Text style={styles.headerTitle}>Tutorial</Text>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep ? '#6366f1' : '#333',
                  width: index === currentStep ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Tutorial content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Step illustration */}
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={[step.color, step.color + '80']}
              style={styles.illustrationCircle}
            >
              <Ionicons name={step.icon as any} size={80} color="#fff" />
            </LinearGradient>
          </View>

          {/* Step info */}
          <View style={styles.stepInfo}>
            <Text style={styles.stepNumber}>Step {step.id} of {tutorialSteps.length}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            
            {/* Tip box */}
            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={16} color="#f59e0b" />
              <Text style={styles.tipText}>{step.tip}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === tutorialSteps.length - 1 ? 'Got it!' : 'Next'}
              </Text>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  illustrationContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    // Add a subtle inner shadow effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepInfo: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  stepNumber: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#f59e0b',
    lineHeight: 18,
    fontWeight: '500',
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