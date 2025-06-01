// store/slices/appSlice.ts - Global App State Management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  language: string;
  permissions: {
    camera: boolean;
    location: boolean;
    nfc: boolean;
  };
  networkStatus: 'online' | 'offline';
  lastSync: string | null;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  appVersion: string;
  buildNumber: string;
}

const initialState: AppState = {
  isOnboarded: false,
  isLoading: false,
  error: null,
  theme: 'dark',
  language: 'en',
  permissions: {
    camera: false,
    location: false,
    nfc: false,
  },
  networkStatus: 'online',
  lastSync: null,
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  appVersion: '1.0.0',
  buildNumber: '1',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnboarded: (state, action: PayloadAction<boolean>) => {
      state.isOnboarded = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    
    updatePermissions: (state, action: PayloadAction<Partial<AppState['permissions']>>) => {
      state.permissions = { ...state.permissions, ...action.payload };
    },
    
    setNetworkStatus: (state, action: PayloadAction<'online' | 'offline'>) => {
      state.networkStatus = action.payload;
    },
    
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    
    updateNotificationSettings: (state, action: PayloadAction<Partial<AppState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    
    setAppInfo: (state, action: PayloadAction<{ version: string; buildNumber: string }>) => {
      state.appVersion = action.payload.version;
      state.buildNumber = action.payload.buildNumber;
    },
    
    resetAppState: () => {
      return initialState;
    },
  },
});

export const {
  setOnboarded,
  setLoading,
  setError,
  clearError,
  setTheme,
  setLanguage,
  updatePermissions,
  setNetworkStatus,
  setLastSync,
  updateNotificationSettings,
  setAppInfo,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;