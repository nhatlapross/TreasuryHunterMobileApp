// contexts/AuthContext.tsx - Authentication context
import { apiService } from '@/services/APIService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  userId: string;
  username: string;
  email: string;
  suiAddress: string;
  profileObjectId?: string;
  rank: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Wallet {
  address: string;
  balance: string;
  suiBalance: string;
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (userData: User, walletData: Wallet, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateWallet: (walletData: Partial<Wallet>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user && !!token;

  // Load auth data on app start
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      console.log('🔍 Loading stored auth data...');
      
      const [storedToken, storedUserData, storedWalletData] = await AsyncStorage.multiGet([
        'auth_token',
        'user_data',
        'wallet_data'
      ]);

      const authToken = storedToken[1];
      const userData = storedUserData[1] ? JSON.parse(storedUserData[1]) : null;
      const walletData = storedWalletData[1] ? JSON.parse(storedWalletData[1]) : null;

      if (authToken && userData && walletData) {
        console.log('✅ Found stored auth data for:', userData.username);
        
        // Verify token is still valid
        try {
          await apiService.setAuthToken(authToken);
          const verifyResponse = await apiService.verifyToken();
          
          if (verifyResponse.success) {
            setToken(authToken);
            setUser(userData);
            setWallet(walletData);
            console.log('✅ Auth state restored successfully');
          } else {
            console.log('❌ Token verification failed, clearing data');
            await clearStoredAuth();
          }
        } catch (verifyError) {
          console.log('❌ Token verification error:', verifyError);
          await clearStoredAuth();
        }
      } else {
        console.log('ℹ️ No stored auth data found');
      }
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove([
      'auth_token',
      'user_data',
      'wallet_data',
      'google_user'
    ]);
    await apiService.clearAuthToken();
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  const login = async (userData: User, walletData: Wallet, authToken: string) => {
    try {
      console.log('💾 Storing auth data for:', userData.username);

      // Store in AsyncStorage
      await AsyncStorage.multiSet([
        ['auth_token', authToken],
        ['user_data', JSON.stringify(userData)],
        ['wallet_data', JSON.stringify(walletData)]
      ]);

      // Set API service token
      await apiService.setAuthToken(authToken);

      // Update state
      setToken(authToken);
      setUser(userData);
      setWallet(walletData);

      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');

      // Sign out from Google
      try {
        await GoogleSignin.signOut();
        console.log('✅ Google sign out successful');
      } catch (googleError) {
        console.warn('⚠️ Google sign out failed:', googleError);
      }

      // Clear stored data
      await clearStoredAuth();

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) return;

      const updatedUser = { ...user, ...userData };
      
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);

      console.log('✅ User data updated');
    } catch (error) {
      console.error('❌ Failed to update user data:', error);
      throw error;
    }
  };

  const updateWallet = async (walletData: Partial<Wallet>) => {
    try {
      if (!wallet) return;

      const updatedWallet = { ...wallet, ...walletData };
      
      await AsyncStorage.setItem('wallet_data', JSON.stringify(updatedWallet));
      setWallet(updatedWallet);

      console.log('✅ Wallet data updated');
    } catch (error) {
      console.error('❌ Failed to update wallet data:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      if (!token) {
        throw new Error('No auth token available');
      }

      console.log('🔄 Refreshing user data from backend...');

      const [profileResponse, walletResponse] = await Promise.all([
        apiService.getProfileStats(),
        apiService.getWalletBalance()
      ]);

      if (profileResponse.success && profileResponse.data) {
        const updatedUser = {
          ...user!,
          rank: profileResponse.data.profile.rank,
        };
        await updateUser(updatedUser);
      }

      if (walletResponse.success && walletResponse.data) {
        const updatedWallet = {
          ...wallet!,
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
  };

  const value: AuthContextType = {
    user,
    wallet,
    token,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    updateUser,
    updateWallet,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

