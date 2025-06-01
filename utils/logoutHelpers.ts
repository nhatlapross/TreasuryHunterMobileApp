// utils/logoutHelpers.ts - Logout Utility Functions
import { Alert } from 'react-native';

export interface LogoutOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void>;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

export const showLogoutConfirmation = (options: LogoutOptions) => {
  const {
    title = 'Logout',
    message = 'Are you sure you want to logout? You will need to sign in again to access your account.',
    confirmText = 'Logout',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    onError
  } = options;

  Alert.alert(
    title,
    message,
    [
      { 
        text: cancelText, 
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: async () => {
          try {
            if (onConfirm) {
              await onConfirm();
            }
          } catch (error) {
            console.error('❌ Logout confirmation error:', error);
            if (onError) {
              onError(error as Error);
            }
          }
        }
      }
    ]
  );
};

export const showLogoutError = (error: Error, onRetry?: () => void) => {
  Alert.alert(
    'Logout Failed',
    `Failed to logout properly: ${error.message}. Please try again.`,
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      ...(onRetry ? [{
        text: 'Retry',
        onPress: onRetry
      }] : [])
    ]
  );
};

export const showLogoutSuccess = (message?: string) => {
  // Optional success message (usually not needed as user is redirected)
  if (message) {
    Alert.alert('Logout Successful', message);
  }
};