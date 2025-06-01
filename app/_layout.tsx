import { AuthProvider } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log('🚀 ROOT Layout rendering...');
  
  const [fontsLoaded] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f0f' },
        }}
      >
        {/* Entry point - checks auth and routes accordingly */}
        <Stack.Screen name="index" />
        
        {/* Authentication flow */}
        <Stack.Screen name="auth/google-login" />
        
        {/* Onboarding flow */}
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/welcome" />
        <Stack.Screen name="onboarding/tutorial" />
        <Stack.Screen name="onboarding/permissions" />
        
        {/* Main app */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </AuthProvider>
  );
}