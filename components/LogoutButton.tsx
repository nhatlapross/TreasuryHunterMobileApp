// components/LogoutButton.tsx - Reusable Logout Button Component
import { useLogout } from '@/hooks/useLogout';
import { showLogoutConfirmation, showLogoutError } from '@/utils/logoutHelpers';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface LogoutButtonProps {
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
  disabled?: boolean;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
  onLogoutError?: (error: Error) => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  style,
  textStyle,
  showIcon = true,
  disabled = false,
  onLogoutStart,
  onLogoutComplete,
  onLogoutError
}) => {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = () => {
    showLogoutConfirmation({
      onConfirm: async () => {
        try {
          onLogoutStart?.();
          await logout();
          onLogoutComplete?.();
        } catch (error) {
          const err = error as Error;
          onLogoutError?.(err);
          showLogoutError(err, handleLogout);
        }
      }
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.logoutButton, style, (disabled || isLoggingOut) && styles.disabled]}
      onPress={handleLogout}
      disabled={disabled || isLoggingOut}
    >
      {isLoggingOut ? (
        <ActivityIndicator size="small" color="#ef4444" />
      ) : (
        showIcon && <Ionicons name="log-out-outline" size={24} color="#ef4444" />
      )}
      <Text style={[styles.logoutText, textStyle]}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </Text>
      {!isLoggingOut && (
        <Ionicons name="chevron-forward" size={24} color="#888" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  logoutText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
});