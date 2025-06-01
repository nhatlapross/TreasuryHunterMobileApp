// slices/walletSlice.ts - Complete Blockchain Wallet State Management
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletState {
  // Wallet info
  address: string | null;
  isInitialized: boolean;
  isConnected: boolean;
  
  // Balance and tokens
  balance: {
    sui: string; // in MIST
    suiFormatted: number; // in SUI units
    usd: number;
  };
  
  // NFTs
  nfts: TreasureNFT[];
  nftLoading: boolean;
  
  // Transactions
  transactions: WalletTransaction[];
  transactionLoading: boolean;
  pendingTransactions: string[]; // transaction digests
  
  // Network
  network: 'testnet' | 'devnet' | 'mainnet' | 'localnet';
  networkInfo: {
    rpcUrl: string;
    explorerUrl: string;
    faucetUrl?: string;
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Security
  isLocked: boolean;
  lastBackup?: string;
  biometricEnabled: boolean;
  
  // Settings
  settings: {
    autoLock: boolean;
    autoLockTimer: number; // minutes
    showBalanceInUsd: boolean;
    defaultGasPrice: string;
    notifications: {
      transactions: boolean;
      lowBalance: boolean;
      nftReceived: boolean;
    };
  };
}

export interface TreasureNFT {
  id: string;
  objectId: string;
  name: string;
  description: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  foundAt: string;
  location?: string;
  treasureId?: string;
  metadata?: any;
  collection?: string;
}

export interface WalletTransaction {
  digest: string;
  timestamp: number;
  type: 'sent' | 'received' | 'nft_mint' | 'nft_transfer' | 'contract_interaction';
  status: 'pending' | 'success' | 'failed';
  amount?: string;
  gasUsed?: string;
  gasFee?: string;
  from?: string;
  to?: string;
  description?: string;
  nftId?: string;
  explorerUrl?: string;
}

const initialState: WalletState = {
  address: null,
  isInitialized: false,
  isConnected: false,
  balance: {
    sui: '0',
    suiFormatted: 0,
    usd: 0,
  },
  nfts: [],
  nftLoading: false,
  transactions: [],
  transactionLoading: false,
  pendingTransactions: [],
  network: 'testnet',
  networkInfo: {
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    explorerUrl: 'https://suiscan.xyz/testnet',
    faucetUrl: 'https://faucet.testnet.sui.io',
  },
  isLoading: false,
  error: null,
  isLocked: false,
  biometricEnabled: false,
  settings: {
    autoLock: true,
    autoLockTimer: 5,
    showBalanceInUsd: true,
    defaultGasPrice: '1000',
    notifications: {
      transactions: true,
      lowBalance: true,
      nftReceived: true,
    },
  },
};

// Async thunks
export const initializeWallet = createAsyncThunk(
  'wallet/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // This would integrate with SuiService
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      return {
        address: mockAddress,
        balance: '1000000000', // 1 SUI in MIST
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize wallet');
    }
  }
);

export const loadWalletBalance = createAsyncThunk(
  'wallet/loadBalance',
  async (_, { rejectWithValue }) => {
    try {
      // Mock balance - would integrate with SuiService
      const balanceInMist = '1500000000'; // 1.5 SUI
      const balanceInSui = 1.5;
      const usdRate = 2.50; // Mock USD rate
      
      return {
        sui: balanceInMist,
        suiFormatted: balanceInSui,
        usd: balanceInSui * usdRate,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load balance');
    }
  }
);

export const loadWalletNFTs = createAsyncThunk(
  'wallet/loadNFTs',
  async (_, { rejectWithValue }) => {
    try {
      // Mock NFTs - would integrate with SuiService
      const mockNFTs: TreasureNFT[] = [
        {
          id: 'nft_1',
          objectId: '0xabc123...',
          name: 'Temple Guardian',
          description: 'A sacred guardian of ancient wisdom',
          image: 'https://images.unsplash.com/photo-1555400208-5498b6b6b4f2?w=400',
          rarity: 'rare',
          attributes: [
            { trait_type: 'Rarity', value: 'Rare' },
            { trait_type: 'Power', value: 85 },
            { trait_type: 'Category', value: 'Historical' },
          ],
          foundAt: '2024-01-15T10:30:00Z',
          location: 'Temple of Literature, Hanoi',
          treasureId: 'treasure_1',
        },
        {
          id: 'nft_2',
          objectId: '0xdef456...',
          name: 'Golden Turtle',
          description: 'The legendary golden turtle of Hoan Kiem Lake',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          rarity: 'legendary',
          attributes: [
            { trait_type: 'Rarity', value: 'Legendary' },
            { trait_type: 'Power', value: 100 },
            { trait_type: 'Category', value: 'Mystery' },
          ],
          foundAt: '2024-01-20T14:45:00Z',
          location: 'Hoan Kiem Lake, Hanoi',
          treasureId: 'treasure_2',
        },
      ];
      
      return mockNFTs;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load NFTs');
    }
  }
);

export const loadTransactionHistory = createAsyncThunk(
  'wallet/loadTransactions',
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      // Mock transactions - would integrate with SuiService
      const mockTransactions: WalletTransaction[] = [
        {
          digest: '0x123abc...',
          timestamp: Date.now() - 3600000,
          type: 'nft_mint',
          status: 'success',
          gasUsed: '1000000',
          gasFee: '0.001',
          description: 'Treasure NFT Minted',
          nftId: 'nft_1',
          explorerUrl: 'https://suiscan.xyz/testnet/tx/0x123abc...',
        },
        {
          digest: '0x456def...',
          timestamp: Date.now() - 7200000,
          type: 'received',
          status: 'success',
          amount: '1000000000',
          from: '0xfaucet...',
          description: 'Received from Faucet',
          explorerUrl: 'https://suiscan.xyz/testnet/tx/0x456def...',
        },
      ];
      
      return mockTransactions.slice(0, limit);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load transactions');
    }
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async (params: { to: string; amount: string; description?: string }, { rejectWithValue }) => {
    try {
      // Mock transaction - would integrate with SuiService
      const mockTransaction: WalletTransaction = {
        digest: `0x${Date.now().toString(16)}`,
        timestamp: Date.now(),
        type: 'sent',
        status: 'pending',
        amount: params.amount,
        to: params.to,
        description: params.description || 'SUI Transfer',
      };
      
      return mockTransaction;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Transaction failed');
    }
  }
);

export const requestFaucet = createAsyncThunk(
  'wallet/requestFaucet',
  async (_, { rejectWithValue }) => {
    try {
      // Mock faucet request - would integrate with SuiService
      const mockTransaction: WalletTransaction = {
        digest: `0x${Date.now().toString(16)}`,
        timestamp: Date.now(),
        type: 'received',
        status: 'pending',
        amount: '1000000000', // 1 SUI
        from: '0xfaucet...',
        description: 'Faucet Request',
      };
      
      return mockTransaction;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Faucet request failed');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
      state.isInitialized = true;
      state.isConnected = true;
    },
    
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    updateBalance: (state, action: PayloadAction<{ sui: string; usd?: number }>) => {
      state.balance.sui = action.payload.sui;
      state.balance.suiFormatted = parseFloat(action.payload.sui) / 1000000000; // Convert MIST to SUI
      if (action.payload.usd !== undefined) {
        state.balance.usd = action.payload.usd;
      }
    },
    
    addNFT: (state, action: PayloadAction<TreasureNFT>) => {
      const exists = state.nfts.find(nft => nft.id === action.payload.id);
      if (!exists) {
        state.nfts.push(action.payload);
      }
    },
    
    removeNFT: (state, action: PayloadAction<string>) => {
      state.nfts = state.nfts.filter(nft => nft.id !== action.payload);
    },
    
    addTransaction: (state, action: PayloadAction<WalletTransaction>) => {
      state.transactions.unshift(action.payload);
      // Keep only latest 50 transactions
      if (state.transactions.length > 50) {
        state.transactions = state.transactions.slice(0, 50);
      }
    },
    
    updateTransactionStatus: (state, action: PayloadAction<{ digest: string; status: 'pending' | 'success' | 'failed' }>) => {
      const transaction = state.transactions.find(tx => tx.digest === action.payload.digest);
      if (transaction) {
        transaction.status = action.payload.status;
      }
      
      // Remove from pending if completed
      if (action.payload.status !== 'pending') {
        state.pendingTransactions = state.pendingTransactions.filter(digest => digest !== action.payload.digest);
      }
    },
    
    addPendingTransaction: (state, action: PayloadAction<string>) => {
      if (!state.pendingTransactions.includes(action.payload)) {
        state.pendingTransactions.push(action.payload);
      }
    },
    
    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter(digest => digest !== action.payload);
    },
    
    switchNetwork: (state, action: PayloadAction<'testnet' | 'devnet' | 'mainnet' | 'localnet'>) => {
      state.network = action.payload;
      
      // Update network info based on network
      switch (action.payload) {
        case 'testnet':
          state.networkInfo = {
            rpcUrl: 'https://fullnode.testnet.sui.io:443',
            explorerUrl: 'https://suiscan.xyz/testnet',
            faucetUrl: 'https://faucet.testnet.sui.io',
          };
          break;
        case 'devnet':
          state.networkInfo = {
            rpcUrl: 'https://fullnode.devnet.sui.io:443',
            explorerUrl: 'https://suiscan.xyz/devnet',
            faucetUrl: 'https://faucet.devnet.sui.io',
          };
          break;
        case 'mainnet':
          state.networkInfo = {
            rpcUrl: 'https://fullnode.mainnet.sui.io:443',
            explorerUrl: 'https://suiscan.xyz/mainnet',
          };
          break;
        case 'localnet':
          state.networkInfo = {
            rpcUrl: 'http://localhost:9000',
            explorerUrl: 'http://localhost:9001',
            faucetUrl: 'http://localhost:9123/gas',
          };
          break;
      }
    },
    
    setLocked: (state, action: PayloadAction<boolean>) => {
      state.isLocked = action.payload;
    },
    
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    
    setLastBackup: (state, action: PayloadAction<string>) => {
      state.lastBackup = action.payload;
    },
    
    updateSettings: (state, action: PayloadAction<Partial<WalletState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    updateNotificationSettings: (state, action: PayloadAction<Partial<WalletState['settings']['notifications']>>) => {
      state.settings.notifications = { ...state.settings.notifications, ...action.payload };
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetWallet: () => {
      return { ...initialState };
    },
    
    // Utility actions for formatting
    formatSuiAmount: (state, action: PayloadAction<string>) => {
      // This is a utility action that doesn't change state
      // Returns formatted SUI amount from MIST
    },
    
    calculateUsdValue: (state, action: PayloadAction<{ suiAmount: number; rate: number }>) => {
      // Utility action to calculate USD value
      return action.payload.suiAmount * action.payload.rate;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Wallet
      .addCase(initializeWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.address = action.payload.address;
        state.isInitialized = true;
        state.isConnected = true;
        state.balance.sui = action.payload.balance;
        state.balance.suiFormatted = parseFloat(action.payload.balance) / 1000000000;
      })
      .addCase(initializeWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = false;
        state.isConnected = false;
      })
      
      // Load Balance
      .addCase(loadWalletBalance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadWalletBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload;
      })
      .addCase(loadWalletBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Load NFTs
      .addCase(loadWalletNFTs.pending, (state) => {
        state.nftLoading = true;
      })
      .addCase(loadWalletNFTs.fulfilled, (state, action) => {
        state.nftLoading = false;
        state.nfts = action.payload;
      })
      .addCase(loadWalletNFTs.rejected, (state, action) => {
        state.nftLoading = false;
        state.error = action.payload as string;
      })
      
      // Load Transactions
      .addCase(loadTransactionHistory.pending, (state) => {
        state.transactionLoading = true;
      })
      .addCase(loadTransactionHistory.fulfilled, (state, action) => {
        state.transactionLoading = false;
        state.transactions = action.payload;
      })
      .addCase(loadTransactionHistory.rejected, (state, action) => {
        state.transactionLoading = false;
        state.error = action.payload as string;
      })
      
      // Send Transaction
      .addCase(sendTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
        state.pendingTransactions.push(action.payload.digest);
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Request Faucet
      .addCase(requestFaucet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(requestFaucet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
        state.pendingTransactions.push(action.payload.digest);
      })
      .addCase(requestFaucet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setWalletAddress,
  setConnected,
  updateBalance,
  addNFT,
  removeNFT,
  addTransaction,
  updateTransactionStatus,
  addPendingTransaction,
  removePendingTransaction,
  switchNetwork,
  setLocked,
  setBiometricEnabled,
  setLastBackup,
  updateSettings,
  updateNotificationSettings,
  setError,
  clearError,
  resetWallet,
  formatSuiAmount,
  calculateUsdValue,
} = walletSlice.actions;

export default walletSlice.reducer;