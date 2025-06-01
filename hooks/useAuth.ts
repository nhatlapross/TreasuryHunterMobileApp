// hooks/useAuth.ts - Simplified version
import { apiService } from '@/services/APIService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

interface User {
  userId: string;
  username: string;
  email: string;
  suiAddress: string;
  profileObjectId?: string;
  rank: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface Wallet {
  address: string;
  balance: string;
  suiBalance: string;
  network?: string;
  verified?: boolean;
}

interface AuthState {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;
}

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    wallet: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    isInitialized: false,
    isLoggingOut: false,
  });

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      console.log('🔍 Loading stored auth data...');
      
      const [tokenResult, userResult, walletResult] = await AsyncStorage.multiGet([
        'auth_token',
        'user_data',
        'wallet_data'
      ]);

      const token = tokenResult[1];
      const userData = userResult[1] ? JSON.parse(userResult[1]) : null;
      const walletData = walletResult[1] ? JSON.parse(walletResult[1]) : null;

      if (token && userData && walletData) {
        console.log('✅ Found stored auth data for:', userData.username);
        
        await apiService.setAuthToken(token);
        
        try {
          const verifyResponse = await apiService.verifyToken();
          if (verifyResponse.success) {
            setAuthState({
              user: userData,
              wallet: walletData,
              token,
              isLoading: false,
              isAuthenticated: true,
              isInitialized: true,
              isLoggingOut: false,
            });
            console.log('✅ Auth state restored successfully');
            return;
          } else {
            console.log('❌ Token verification failed, clearing data');
            await clearAuthData();
          }
        } catch (verifyError) {
          console.log('❌ Token verification error:', verifyError);
          await clearAuthData();
        }
      } else {
        console.log('ℹ️ No stored auth data found');
      }
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
    }

    setAuthState(prev => ({
      ...prev,
      isLoading: false,
      isInitialized: true,
    }));
  };

  const clearAuthData = async () => {
    await AsyncStorage.multiRemove([
      'auth_token',
      'user_data',
      'wallet_data',
      'google_user',
      'onboarding_completed'
    ]);
    
    await apiService.clearAuthToken();
    
    setAuthState({
      user: null,
      wallet: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: true,
      isLoggingOut: false,
    });
  };

  const login = useCallback(async (userData: User, walletData: Wallet, token: string) => {
    try {
      console.log('💾 Storing auth data for:', userData.username);

      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_data', JSON.stringify(userData)],
        ['wallet_data', JSON.stringify(walletData)]
      ]);

      await apiService.setAuthToken(token);

      setAuthState({
        user: userData,
        wallet: walletData,
        token,
        isLoading: false,
        isAuthenticated: true,
        isInitialized: true,
        isLoggingOut: false,
      });

      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      setAuthState(prev => ({ ...prev, isLoggingOut: true }));

      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
          console.log('✅ Google sign out successful');
        }
      } catch (googleError) {
        console.warn('⚠️ Google sign out failed:', googleError);
      }

      await clearAuthData();

      console.log('🧭 Navigating to login screen...');
      router.replace('/auth/google-login');

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      setAuthState(prev => ({ ...prev, isLoggingOut: false }));
      throw error;
    }
  }, [router]);

  const updateUser = useCallback(async (updatedUserData: Partial<User>) => {
    try {
      if (!authState.user) return;

      const newUser = { ...authState.user, ...updatedUserData };
      
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      
      setAuthState(prev => ({
        ...prev,
        user: newUser
      }));

      console.log('✅ User data updated');
    } catch (error) {
      console.error('❌ Failed to update user data:', error);
      throw error;
    }
  }, [authState.user]);

  const updateWallet = useCallback(async (updatedWalletData: Partial<Wallet>) => {
    try {
      if (!authState.wallet) return;

      const newWallet = { ...authState.wallet, ...updatedWalletData };
      
      await AsyncStorage.setItem('wallet_data', JSON.stringify(newWallet));
      
      setAuthState(prev => ({
        ...prev,
        wallet: newWallet
      }));

      console.log('✅ Wallet data updated');
    } catch (error) {
      console.error('❌ Failed to update wallet data:', error);
      throw error;
    }
  }, [authState.wallet]);

  const refreshUserData = useCallback(async () => {
    try {
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Refreshing user data from backend...');

      const [profileResponse, walletResponse] = await Promise.all([
        apiService.getProfileStats().catch(err => {
          console.warn('Profile refresh failed:', err);
          return null;
        }),
        apiService.getWalletBalance().catch(err => {
          console.warn('Wallet refresh failed:', err);
          return null;
        })
      ]);

      if (profileResponse?.success && profileResponse.data) {
        const updatedUser = {
          ...authState.user!,
          rank: profileResponse.data.profile.rank,
        };
        await updateUser(updatedUser);
      }

      if (walletResponse?.success && walletResponse.data) {
        const updatedWallet = {
          ...authState.wallet!,
          balance: walletResponse.data.wallet.balance,
          suiBalance: walletResponse.data.wallet.suiBalance,
        };
        await updateWallet(updatedWallet);
      }

      console.log('✅ User data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      throw error;
    }
  }, [authState.isAuthenticated, authState.user, authState.wallet, updateUser, updateWallet]);

  return {
    ...authState,
    login,
    logout,
    updateUser,
    updateWallet,
    refreshUserData,
  };
};

// Export as default as well for compatibility
export default useAuth;