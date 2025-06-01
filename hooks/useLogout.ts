// hooks/useLogout.ts - Logout Hook with Navigation
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export const useLogout = () => {
  const { logout: authLogout } = useAuthContext();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('🚪 Starting logout process...');
      
      // Clear auth data
      await authLogout();
      
      // Navigate to login
      console.log('🧭 Navigating to login screen...');
      router.replace('/auth/google-login');
      
      console.log('✅ Logout and navigation completed');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      
      // Try navigation anyway in case auth was cleared
      try {
        router.replace('/auth/google-login');
      } catch (navError) {
        console.error('❌ Navigation also failed:', navError);
        // Fallback to index
        router.replace('/');
      }
      
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    isLoggingOut
  };
};