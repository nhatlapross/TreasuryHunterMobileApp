// src/hooks/useColorScheme.ts - Alternative Fix
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Custom hook that wraps React Native's useColorScheme
 * Returns the current color scheme, ensuring it's never undefined
 */
export function useColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme();
  // Default to 'dark' if scheme is null/undefined (follows your app's dark theme)
  return scheme === 'light' ? 'light' : 'dark';
}

// Export the type for use in other components
export type ColorScheme = 'light' | 'dark';