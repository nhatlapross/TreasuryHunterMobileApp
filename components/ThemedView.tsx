// src/components/ThemedView.tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useColorScheme(); // No need for ?? 'light' anymore
  const backgroundColor = theme === 'light' 
    ? lightColor ?? Colors.light.background 
    : darkColor ?? Colors.dark.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

// src/components/ui/IconSymbol.tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

export type IconSymbolProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  weight?: 'light' | 'medium' | 'bold';
  style?: StyleProp<TextStyle>; // Changed from ViewStyle to TextStyle
};

/**
 * IconSymbol component that wraps Ionicons
 * Maps SF Symbols style names to Ionicons equivalents
 */
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  // Map SF Symbols style names to Ionicons
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'chevron.right': 'chevron-forward',
    'chevron.left': 'chevron-back',
    'chevron.up': 'chevron-up',
    'chevron.down': 'chevron-down',
    'plus': 'add',
    'minus': 'remove',
    'xmark': 'close',
    'house': 'home',
    'person': 'person',
    'gear': 'settings',
    'magnifyingglass': 'search',
    'heart': 'heart',
    'star': 'star',
    'bookmark': 'bookmark',
    'trash': 'trash',
    'pencil': 'pencil',
    'camera': 'camera',
    'photo': 'image',
    'map': 'map',
    'location': 'location',
    'phone': 'call',
    'envelope': 'mail',
    'message': 'chatbubble',
    'bell': 'notifications',
    'lock': 'lock-closed',
    'key': 'key',
    'eye': 'eye',
    'eye.slash': 'eye-off',
    'arrow.right': 'arrow-forward',
    'arrow.left': 'arrow-back',
    'arrow.up': 'arrow-up',
    'arrow.down': 'arrow-down',
  };

  const mappedName = iconMap[name as string] || name;

  return (
    <Ionicons 
      name={mappedName}
      size={size}
      color={color}
      style={style}
    />
  );
}