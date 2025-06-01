// store/slices/treasureSlice.ts - Complete Treasure Management State
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Treasure {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  imageUrl?: string;
  isFound: boolean;
  foundAt?: string;
  foundBy?: string;
  createdAt: string;
  expiresAt?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  reward: {
    experience: number;
    sui: number;
    nftMetadata?: TreasureNFTMetadata;
  };
  clues: TreasureClue[];
  requirements: TreasureRequirement[];
  tags: string[];
  category: 'historical' | 'nature' | 'urban' | 'mystery' | 'art' | 'technology';
  distance?: number; // Distance from user in meters
}

export interface TreasureNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

export interface TreasureClue {
  id: string;
  type: 'text' | 'image' | 'riddle' | 'coordinate';
  content: string;
  isRevealed: boolean;
  revealedAt?: string;
  order: number;
}

export interface TreasureRequirement {
  type: 'level' | 'achievement' | 'time' | 'weather' | 'group_size';
  value: any;
  description: string;
  isMet: boolean;
}

export interface TreasureFilter {
  rarity?: ('common' | 'rare' | 'epic' | 'legendary')[];
  difficulty?: (1 | 2 | 3 | 4 | 5)[];
  category?: string[];
  maxDistance?: number; // in km
  showFound?: boolean;
  sortBy?: 'distance' | 'rarity' | 'difficulty' | 'created' | 'reward';
  sortOrder?: 'asc' | 'desc';
}

export interface TreasureHunt {
  id: string;
  treasureId: string;
  hunterId: string;
  startedAt: string;
  completedAt?: string;
  status: 'active' | 'completed' | 'abandoned' | 'failed';
  timeSpent: number; // in minutes
  hintsUsed: number;
  distance: number; // in meters
  route: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
}

export interface TreasureState {
  // Treasure data
  nearbyTreasures: Treasure[];
  foundTreasures: Treasure[];
  allTreasures: Treasure[];
  currentTreasure: Treasure | null;
  
  // Hunt data
  activeHunt: TreasureHunt | null;
  huntHistory: TreasureHunt[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  filters: TreasureFilter;
  searchQuery: string;
  
  // Location data
  userLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  } | null;
  
  // Statistics
  stats: {
    totalFound: number;
    totalDistance: number;
    averageHuntTime: number;
    successRate: number;
    favoriteCategory: string;
    rarityDistribution: Record<string, number>;
  };
}

const initialState: TreasureState = {
  nearbyTreasures: [],
  foundTreasures: [],
  allTreasures: [],
  currentTreasure: null,
  activeHunt: null,
  huntHistory: [],
  isLoading: false,
  error: null,
  filters: {
    showFound: false,
    sortBy: 'distance',
    sortOrder: 'asc',
  },
  searchQuery: '',
  userLocation: null,
  stats: {
    totalFound: 0,
    totalDistance: 0,
    averageHuntTime: 0,
    successRate: 0,
    favoriteCategory: '',
    rarityDistribution: {},
  },
};

// Async thunks
export const loadNearbyTreasures = createAsyncThunk(
  'treasure/loadNearby',
  async (params: { latitude: number; longitude: number; radius: number }) => {
    // Mock nearby treasures data
    const mockTreasures: Treasure[] = [
      {
        id: 'treasure_1',
        name: 'Ancient Temple Secret',
        description: 'A hidden treasure in the heart of the ancient temple',
        rarity: 'rare',
        coordinates: { latitude: params.latitude + 0.001, longitude: params.longitude + 0.001 },
        address: 'Temple of Literature, Hanoi',
        imageUrl: 'https://images.unsplash.com/photo-1555400208-5498b6b6b4f2?w=400',
        isFound: false,
        createdAt: new Date().toISOString(),
        difficulty: 3,
        reward: {
          experience: 150,
          sui: 0.5,
          nftMetadata: {
            name: 'Temple Guardian NFT',
            description: 'A sacred guardian of ancient wisdom',
            image: 'https://images.unsplash.com/photo-1555400208-5498b6b6b4f2?w=400',
            attributes: [
              { trait_type: 'Rarity', value: 'Rare' },
              { trait_type: 'Category', value: 'Historical' },
              { trait_type: 'Power', value: 85 },
            ],
          },
        },
        clues: [
          {
            id: 'clue_1',
            type: 'text',
            content: 'Where scholars once walked and wisdom was sought...',
            isRevealed: true,
            order: 1,
          },
        ],
        requirements: [
          {
            type: 'level',
            value: 3,
            description: 'Minimum level 3 required',
            isMet: true,
          },
        ],
        tags: ['historical', 'temple', 'wisdom'],
        category: 'historical',
        distance: 850,
      },
      {
        id: 'treasure_2',
        name: 'Lake Legend',
        description: 'The legendary treasure of Hoan Kiem Lake',
        rarity: 'legendary',
        coordinates: { latitude: params.latitude - 0.002, longitude: params.longitude + 0.002 },
        address: 'Hoan Kiem Lake, Hanoi',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        isFound: false,
        createdAt: new Date().toISOString(),
        difficulty: 5,
        reward: {
          experience: 500,
          sui: 2.0,
          nftMetadata: {
            name: 'Golden Turtle NFT',
            description: 'The legendary golden turtle of the lake',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
            attributes: [
              { trait_type: 'Rarity', value: 'Legendary' },
              { trait_type: 'Category', value: 'Mystery' },
              { trait_type: 'Power', value: 100 },
            ],
          },
        },
        clues: [
          {
            id: 'clue_2',
            type: 'riddle',
            content: 'In the heart where turtles swim, golden secrets lie within...',
            isRevealed: true,
            order: 1,
          },
        ],
        requirements: [
          {
            type: 'level',
            value: 10,
            description: 'Minimum level 10 required',
            isMet: false,
          },
        ],
        tags: ['legendary', 'lake', 'turtle'],
        category: 'mystery',
        distance: 1200,
      },
    ];
    
    return mockTreasures;
  }
);

export const startTreasureHunt = createAsyncThunk(
  'treasure/startHunt',
  async (params: { treasureId: string; hunterId: string; location: { latitude: number; longitude: number } }) => {
    const hunt: TreasureHunt = {
      id: `hunt_${Date.now()}`,
      treasureId: params.treasureId,
      hunterId: params.hunterId,
      startedAt: new Date().toISOString(),
      status: 'active',
      timeSpent: 0,
      hintsUsed: 0,
      distance: 0,
      route: [{
        latitude: params.location.latitude,
        longitude: params.location.longitude,
        timestamp: new Date().toISOString(),
      }],
    };
    
    return hunt;
  }
);

export const completeTreasureHunt = createAsyncThunk(
  'treasure/completeHunt',
  async (params: { huntId: string; success: boolean; finalLocation: { latitude: number; longitude: number } }) => {
    return {
      huntId: params.huntId,
      success: params.success,
      completedAt: new Date().toISOString(),
      finalLocation: params.finalLocation,
    };
  }
);

const treasureSlice = createSlice({
  name: 'treasure',
  initialState,
  reducers: {
    setCurrentTreasure: (state, action: PayloadAction<Treasure | null>) => {
      state.currentTreasure = action.payload;
    },
    
    setUserLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; accuracy?: number }>) => {
      state.userLocation = {
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
    },
    
    updateFilters: (state, action: PayloadAction<Partial<TreasureFilter>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    markTreasureFound: (state, action: PayloadAction<{ treasureId: string; hunterId: string }>) => {
      const treasure = state.nearbyTreasures.find(t => t.id === action.payload.treasureId);
      if (treasure) {
        treasure.isFound = true;
        treasure.foundAt = new Date().toISOString();
        treasure.foundBy = action.payload.hunterId;
        
        // Move to found treasures
        state.foundTreasures.push(treasure);
        state.nearbyTreasures = state.nearbyTreasures.filter(t => t.id !== action.payload.treasureId);
        
        // Update stats
        state.stats.totalFound += 1;
        const category = treasure.category;
        state.stats.rarityDistribution[treasure.rarity] = (state.stats.rarityDistribution[treasure.rarity] || 0) + 1;
      }
    },
    
    revealClue: (state, action: PayloadAction<{ treasureId: string; clueId: string }>) => {
      const treasure = state.currentTreasure;
      if (treasure && treasure.id === action.payload.treasureId) {
        const clue = treasure.clues.find(c => c.id === action.payload.clueId);
        if (clue) {
          clue.isRevealed = true;
          clue.revealedAt = new Date().toISOString();
        }
      }
    },
    
    updateHuntProgress: (state, action: PayloadAction<{ 
      timeSpent: number; 
      distance: number; 
      location: { latitude: number; longitude: number } 
    }>) => {
      if (state.activeHunt) {
        state.activeHunt.timeSpent = action.payload.timeSpent;
        state.activeHunt.distance = action.payload.distance;
        state.activeHunt.route.push({
          ...action.payload.location,
          timestamp: new Date().toISOString(),
        });
      }
    },
    
    useHint: (state) => {
      if (state.activeHunt) {
        state.activeHunt.hintsUsed += 1;
      }
    },
    
    abandonHunt: (state) => {
      if (state.activeHunt) {
        state.activeHunt.status = 'abandoned';
        state.huntHistory.push(state.activeHunt);
        state.activeHunt = null;
        state.currentTreasure = null;
      }
    },
    
    updateStats: (state, action: PayloadAction<Partial<TreasureState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    
    addTreasureToNearby: (state, action: PayloadAction<Treasure>) => {
      const exists = state.nearbyTreasures.find(t => t.id === action.payload.id);
      if (!exists) {
        state.nearbyTreasures.push(action.payload);
      }
    },
    
    removeTreasureFromNearby: (state, action: PayloadAction<string>) => {
      state.nearbyTreasures = state.nearbyTreasures.filter(t => t.id !== action.payload);
    },
    
    clearNearbyTreasures: (state) => {
      state.nearbyTreasures = [];
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetTreasureState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load Nearby Treasures
      .addCase(loadNearbyTreasures.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadNearbyTreasures.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyTreasures = action.payload;
        state.allTreasures = [...state.foundTreasures, ...action.payload];
      })
      .addCase(loadNearbyTreasures.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load nearby treasures';
      })
      
      // Start Treasure Hunt
      .addCase(startTreasureHunt.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startTreasureHunt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeHunt = action.payload;
        
        // Set current treasure
        const treasure = state.nearbyTreasures.find(t => t.id === action.payload.treasureId);
        if (treasure) {
          state.currentTreasure = treasure;
        }
      })
      .addCase(startTreasureHunt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start treasure hunt';
      })
      
      // Complete Treasure Hunt
      .addCase(completeTreasureHunt.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeTreasureHunt.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (state.activeHunt) {
          state.activeHunt.status = action.payload.success ? 'completed' : 'failed';
          state.activeHunt.completedAt = action.payload.completedAt;
          
          // Add to history
          state.huntHistory.push(state.activeHunt);
          
          // Mark treasure as found if successful
          if (action.payload.success && state.currentTreasure) {
            state.currentTreasure.isFound = true;
            state.currentTreasure.foundAt = action.payload.completedAt;
            state.foundTreasures.push(state.currentTreasure);
            state.nearbyTreasures = state.nearbyTreasures.filter(t => t.id !== state.currentTreasure!.id);
            
            // Update stats
            state.stats.totalFound += 1;
            state.stats.totalDistance += state.activeHunt.distance;
            state.stats.averageHuntTime = state.huntHistory.length > 0 
              ? state.huntHistory.reduce((sum, hunt) => sum + hunt.timeSpent, 0) / state.huntHistory.length 
              : 0;
            state.stats.successRate = state.huntHistory.length > 0
              ? (state.huntHistory.filter(h => h.status === 'completed').length / state.huntHistory.length) * 100
              : 0;
          }
          
          // Clear active hunt
          state.activeHunt = null;
          state.currentTreasure = null;
        }
      })
      .addCase(completeTreasureHunt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to complete treasure hunt';
      });
  },
});

export const {
  setCurrentTreasure,
  setUserLocation,
  updateFilters,
  setSearchQuery,
  markTreasureFound,
  revealClue,
  updateHuntProgress,
  useHint,
  abandonHunt,
  updateStats,
  addTreasureToNearby,
  removeTreasureFromNearby,
  clearNearbyTreasures,
  setError,
  clearError,
  resetTreasureState,
} = treasureSlice.actions;

export default treasureSlice.reducer;