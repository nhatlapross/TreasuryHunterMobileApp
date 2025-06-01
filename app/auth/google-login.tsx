// app/auth/google-login.tsx - Updated with dev login for debug mode
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Google Sign In
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Services
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/APIService';

const { width, height } = Dimensions.get('window');
const __DEV__ = process.env.NODE_ENV === 'development';

interface GoogleUser {
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    familyName?: string;
    givenName?: string;
  };
  idToken: string;
  accessToken: string;
}

export default function GoogleLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Animation setup
  useEffect(() => {
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

  // Initialize Google Sign In
  useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const initializeGoogleSignIn = async () => {
    try {
      console.log('🔧 Initializing Google Sign In...');
      
      await GoogleSignin.configure({
        // Replace with your actual Web Client ID from Google Cloud Console
        webClientId: '545152360389-mt39cbakp574f63aa505qm3h96l8q3mk.apps.googleusercontent.com',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        accountName: '',
        // Replace with your actual iOS Client ID if you have one
        iosClientId: '545152360389-mt39cbakp574f63aa505qm3h96l8q3mk.apps.googleusercontent.com',
        googleServicePlistPath: '',
      });

      // Test backend connection
      console.log('🔗 Testing backend connection...');
      const isBackendAvailable = await apiService.testConnection();
      if (!isBackendAvailable) {
        console.warn('⚠️ Backend not reachable, but continuing...');
      } else {
        console.log('✅ Backend connection successful');
      }

      console.log('✅ Google Sign In initialized successfully');
    } catch (error) {
      console.error('❌ Google Sign In initialization failed:', error);
      Alert.alert(
        'Setup Error', 
        'Google Sign In could not be initialized. Please check your configuration.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('🔑 Starting Google Sign In...');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign In successful:', userInfo.user.email);
      
      // Call backend API with Google user info
      await handleBackendLogin(userInfo);
      
    } catch (error: any) {
      console.error('❌ Google Sign In failed:', error);
      
      // Handle specific Google Sign In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('ℹ️ User cancelled Google Sign In');
        return; // Don't show error for user cancellation
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Info', 'Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available');
      } else {
        Alert.alert(
          'Sign In Failed', 
          error.message || 'Failed to sign in with Google. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dev login function - only works in development mode
  const handleDevLogin = async () => {
    if (!__DEV__) return; // Only works in development
    
    setIsLoading(true);
    
    try {
      console.log('🛠️ Dev Login - Simulating backend login...');
      
      // Create mock Google user object with dev credentials
      const mockGoogleUser: GoogleUser = {
        user: {
          id: 'dev_user_123',
          name: 'Alvin Ichi',
          email: 'nhatlapross@gmail.com',
          photo: 'https://via.placeholder.com/150',
          familyName: 'Ichi',
          givenName: 'Alvin',
        },
        idToken: 'dev_id_token_123',
        accessToken: 'dev_access_token_123',
      };

      // Try login first, then registration if needed
      await handleBackendLogin(mockGoogleUser);
      
    } catch (error: any) {
      console.error('❌ Dev login failed:', error);
      Alert.alert('Dev Login Failed', error.message || 'Development login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendLogin = async (googleUser: GoogleUser) => {
    try {
      console.log('🌐 Calling backend login API using ApiService...');
      console.log('📧 Email:', googleUser.user.email);
      console.log('👤 Name:', googleUser.user.name);

      // Use ApiService for login
      const response = await apiService.login(
        googleUser.user.email,
        undefined, // No password for Google login
        {
          googleId: googleUser.user.id,
          idToken: googleUser.idToken,
          accessToken: googleUser.accessToken,
          name: googleUser.user.name,
          photo: googleUser.user.photo
        }
      );

      console.log('📡 Backend response:', response.success ? 'Success' : 'Failed');

      if (response.success && response.data) {
        // Store in context using the auth hook
        await login(response.data.user, response.data.wallet, response.data.token);

        // Store additional Google user data
        await AsyncStorage.setItem('google_user', JSON.stringify(googleUser.user));

        console.log('💾 Auth data stored successfully');
        console.log('🏛️ User has Sui address:', response.data.user.suiAddress);
        console.log('💰 Wallet balance:', response.data.wallet.suiBalance, 'SUI');

        // Navigate to onboarding after successful login
        await navigateAfterLogin();
        
      } else {
        // Login failed, might need to register
        throw new Error(response.message || 'Login failed');
      }

    } catch (error: any) {
      console.error('❌ Backend login failed:', error);
      
      // Check if it's a user not found error - try registration
      if (error.message?.includes('not found') || 
          error.message?.includes('User not found') ||
          error.message?.includes('Authentication failed')) {
        console.log('👤 User not found, attempting registration...');
        await handleBackendRegistration(googleUser);
        return;
      }
      
      // Handle other errors
      handleLoginError(error, googleUser);
    }
  };

  const handleBackendRegistration = async (googleUser: GoogleUser) => {
    try {
      console.log('📝 Attempting user registration using ApiService...');

      // For dev login, use the predefined username
      const username = googleUser.user.email === 'nhatlapross@gmail.com' 
        ? 'alvinIchi' 
        : `${googleUser.user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')}_${Math.random().toString(36).substring(2, 5)}`;

      // Use ApiService for registration
      const response = await apiService.register(
        username,
        googleUser.user.email,
        undefined, // No password for Google registration
        {
          googleId: googleUser.user.id,
          idToken: googleUser.idToken,
          accessToken: googleUser.accessToken,
          name: googleUser.user.name,
          photo: googleUser.user.photo
        }
      );

      console.log('📡 Registration response:', response.success ? 'Success' : 'Failed');

      if (response.success && response.data) {
        // Store in context using the auth hook
        await login(response.data.user, response.data.wallet, response.data.token);

        // Store additional Google user data
        await AsyncStorage.setItem('google_user', JSON.stringify(googleUser.user));

        console.log('💾 New user data stored successfully');
        console.log('🆕 New Sui wallet created:', response.data.user.suiAddress);

        // Show welcome message for new user
        const welcomeMessage = __DEV__ && googleUser.user.email === 'nhatlapross@gmail.com'
          ? `Dev account created successfully!\n\n👤 Username: ${response.data.user.username}\n🏛️ Sui Wallet created\n💰 Ready to hunt treasures!`
          : `Account created successfully!\n\n👤 Username: ${response.data.user.username}\n🏛️ Sui Wallet created\n💰 Ready to hunt treasures!`;

        Alert.alert(
          'Welcome to Treasure Hunt! 🎉',
          welcomeMessage,
          [
            {
              text: 'Let\'s Go!',
              onPress: () => navigateAfterLogin()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Registration failed');
      }

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      handleRegistrationError(error, googleUser);
    }
  };

  const navigateAfterLogin = async () => {
    try {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding_completed');
      
      if (hasCompletedOnboarding) {
        console.log('🏠 User has completed onboarding, going to main app');
        router.replace('/(tabs)');
      } else {
        console.log('📚 First time login, going to onboarding');
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback to onboarding
      router.replace('/onboarding');
    }
  };

  const handleLoginError = (error: any, googleUser: GoogleUser) => {
    // Check for network/connection errors
    if (error.message?.includes('fetch') || 
        error.message?.includes('Network') ||
        error.message?.includes('connection')) {
      Alert.alert(
        'Connection Error',
        'Could not connect to the server. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => handleBackendLogin(googleUser) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Login Failed',
        error.message || 'Failed to authenticate with backend. Please try again.'
      );
    }
    
    // Sign out from Google on backend failure (skip for dev login)
    if (googleUser.user.id !== 'dev_user_123') {
      GoogleSignin.signOut().catch(console.error);
    }
  };

  const handleRegistrationError = (error: any, googleUser: GoogleUser) => {
    // Handle specific registration errors
    if (error.message?.includes('username') || error.message?.includes('Username already taken')) {
      Alert.alert(
        'Username Taken',
        'Please try signing in again to generate a different username.'
      );
    } else if (error.message?.includes('email') || error.message?.includes('Email already registered')) {
      Alert.alert(
        'Account Exists',
        'An account with this email already exists. Please try signing in instead.'
      );
    } else {
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    }
    
    // Sign out from Google on registration failure (skip for dev login)
    if (googleUser.user.id !== 'dev_user_123') {
      GoogleSignin.signOut().catch(console.error);
    }
  };

  const handleSkipLogin = () => {
    Alert.alert(
      'Continue as Guest?',
      'You can explore the app without signing in, but you won\'t be able to:\n\n• Save your progress\n• Earn NFT rewards\n• Compete on leaderboards\n• Use blockchain features',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue as Guest', 
          onPress: () => router.replace('/onboarding')
        }
      ]
    );
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Initializing...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.gradient}
      >
        <Animated.ScrollView 
          contentContainerStyle={styles.scrollContainer}
          style={[
            styles.scrollView,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#ec4899']}
                style={styles.logoGradient}
              >
                <Ionicons name="diamond" size={60} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Treasure Hunt</Text>
            <Text style={styles.subtitle}>
              Discover hidden treasures with blockchain rewards
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Ionicons name="search" size={24} color="#6366f1" />
              <Text style={styles.benefitText}>Scan QR & NFC tags</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="trophy" size={24} color="#ec4899" />
              <Text style={styles.benefitText}>Earn NFT rewards</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="people" size={24} color="#8b5cf6" />
              <Text style={styles.benefitText}>Compete with friends</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="wallet" size={24} color="#10b981" />
              <Text style={styles.benefitText}>Sui blockchain integration</Text>
            </View>
          </View>

          {/* Google Sign In Section */}
          <View style={styles.authContainer}>
            <Text style={styles.authTitle}>Sign in to start your adventure</Text>
            
            <View style={styles.googleButtonContainer}>
              <GoogleSigninButton
                style={styles.googleButton}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              />
            </View>

            {/* Dev Login Button - Only in Debug Mode */}
            {__DEV__ && (
              <View style={styles.devLoginContainer}>
                <TouchableOpacity 
                  style={styles.devLoginButton}
                  onPress={handleDevLogin}
                  disabled={isLoading}
                >
                  <Ionicons name="bug" size={20} color="#ff6b6b" />
                  <Text style={styles.devLoginText}>Dev Login (Debug)</Text>
                </TouchableOpacity>
                <Text style={styles.devLoginSubtext}>
                  Uses: alvinIchi / nhatlapross@gmail.com
                </Text>
              </View>
            )}

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.loadingAuthText}>Signing in...</Text>
              </View>
            )}

            {/* Alternative Options */}
            <View style={styles.alternativeContainer}>
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleSkipLogin}
                disabled={isLoading}
              >
                <Text style={styles.skipButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Notice */}
            <Text style={styles.privacyText}>
              By signing in, you agree to our Terms of Service and Privacy Policy. 
              Your Google account will be used to create a secure Sui wallet for NFT rewards.
            </Text>
          </View>

          {/* Footer Features */}
          <View style={styles.footerFeatures}>
            <Text style={styles.footerTitle}>What you'll get:</Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Secure Sui wallet automatically created</Text>
              <Text style={styles.featureItem}>• Hunt for real-world treasure locations</Text>
              <Text style={styles.featureItem}>• Mint NFTs as proof of discovery</Text>
              <Text style={styles.featureItem}>• Climb the global leaderboard</Text>
              <Text style={styles.featureItem}>• Unlock achievements and ranks</Text>
              <Text style={styles.featureItem}>• Request free testnet SUI tokens</Text>
            </View>
          </View>
        </Animated.ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 40,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  benefitText: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 16,
    fontWeight: '500',
  },
  authContainer: {
    marginBottom: 30,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  googleButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleButton: {
    width: width * 0.8,
    height: 52,
  },
  // Dev login styles
  devLoginContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  devLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    marginBottom: 8,
  },
  devLoginText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  devLoginSubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingAuthText: {
    color: '#6366f1',
    fontSize: 14,
    marginLeft: 8,
  },
  alternativeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  footerFeatures: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});