// app/store/store.ts - Redux Store for Expo
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Slices
import appSlice from './slices/appSlice';
import hunterSlice from './slices/hunterSlice';
import treasureSlice from './slices/treasureSlice';
import walletSlice from './slices/walletSlice';

export const store = configureStore({
  reducer: {
    hunter: hunterSlice,
    treasure: treasureSlice,
    wallet: walletSlice,
    app: appSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;