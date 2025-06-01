// src/constants/Colors.ts
/**
 * Colors used throughout the app for light and dark themes
 */

const tintColorLight = '#6366f1';
const tintColorDark = '#8b5cf6';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    surface: '#f8fafc',
    border: '#e2e8f0',
    muted: '#64748b',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0f0f0f',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#8b5cf6',
    secondary: '#6366f1',
    accent: '#ec4899',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    surface: '#1a1a1a',
    border: '#374151',
    muted: '#6b7280',
  },
} as const;

export type ColorScheme = typeof Colors.light;