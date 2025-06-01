// store/slices/hunterSlice.ts - Hunter Profile State Management
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface HunterProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  rank: 'Beginner' | 'Explorer' | 'Adventurer' | 'Expert' | 'Master Hunter';
  level: number;
  experience: number;
  experienceToNext: number;
  totalTreasuresFound: number;
  currentStreak: number;
  longestStreak: number;
  joinedAt: string;
  lastActiveAt: string;
  achievements: Achievement[];
  stats: HunterStats;
  preferences: HunterPreferences;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface HunterStats {
  totalDistance: number; // in meters
  treasuresFoundToday: number;
  treasuresFoundThisWeek: number;
  treasuresFoundThisMonth: number;
  favoriteHuntingTime: string;
  mostFoundRarity: string;
  averageHuntTime: number; // in minutes
  successRate: number; // percentage
}

export interface HunterPreferences {
  huntingRadius: number; // in km
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  preferredTreasureTypes: string[];
  notifications: {
    nearbyTreasures: boolean;
    achievementUnlocked: boolean;
    weeklyReport: boolean;
    friendActivity: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
    showLocation: boolean;
  };
}

export interface HunterState {
  profile: HunterProfile | null;
  isLoading: boolean;
  error: string | null;
  leaderboard: HunterProfile[];
  friends: HunterProfile[];
  nearbyHunters: HunterProfile[];
}

const initialState: HunterState = {
  profile: null,
  isLoading: false,
  error: null,
  leaderboard: [],
  friends: [],
  nearbyHunters: [],
};

// Async thunks for API calls
export const createHunterProfile = createAsyncThunk(
  'hunter/createProfile',
  async (profileData: { username: string; email?: string }) => {
    // This would normally make an API call
    const newProfile: HunterProfile = {
      id: `hunter_${Date.now()}`,
      username: profileData.username,
      email: profileData.email,
      rank: 'Beginner',
      level: 1,
      experience: 0,
      experienceToNext: 100,
      totalTreasuresFound: 0,
      currentStreak: 0,
      longestStreak: 0,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      achievements: [],
      stats: {
        totalDistance: 0,
        treasuresFoundToday: 0,
        treasuresFoundThisWeek: 0,
        treasuresFoundThisMonth: 0,
        favoriteHuntingTime: 'afternoon',
        mostFoundRarity: 'common',
        averageHuntTime: 0,
        successRate: 0,
      },
      preferences: {
        huntingRadius: 5,
        difficultyLevel: 'easy',
        preferredTreasureTypes: [],
        notifications: {
          nearbyTreasures: true,
          achievementUnlocked: true,
          weeklyReport: true,
          friendActivity: false,
        },
        privacy: {
          showProfile: true,
          showStats: true,
          showLocation: false,
        },
      },
    };
    
    return newProfile;
  }
);

export const updateHunterProfile = createAsyncThunk(
  'hunter/updateProfile',
  async (updates: Partial<HunterProfile>) => {
    // This would normally make an API call
    return updates;
  }
);

export const loadLeaderboard = createAsyncThunk(
  'hunter/loadLeaderboard',
  async () => {
    // Mock leaderboard data
    const mockLeaderboard: HunterProfile[] = [
      {
        id: 'hunter_1',
        username: 'TreasureMaster',
        rank: 'Master Hunter',
        level: 25,
        experience: 5000,
        experienceToNext: 500,
        totalTreasuresFound: 150,
        currentStreak: 12,
        longestStreak: 25,
        joinedAt: '2024-01-15T00:00:00Z',
        lastActiveAt: new Date().toISOString(),
        achievements: [],
        stats: {
          totalDistance: 50000,
          treasuresFoundToday: 3,
          treasuresFoundThisWeek: 15,
          treasuresFoundThisMonth: 45,
          favoriteHuntingTime: 'morning',
          mostFoundRarity: 'legendary',
          averageHuntTime: 25,
          successRate: 85,
        },
        preferences: {
          huntingRadius: 10,
          difficultyLevel: 'expert',
          preferredTreasureTypes: ['legendary', 'rare'],
          notifications: {
            nearbyTreasures: true,
            achievementUnlocked: true,
            weeklyReport: true,
            friendActivity: true,
          },
          privacy: {
            showProfile: true,
            showStats: true,
            showLocation: false,
          },
        },
      },
    ];
    
    return mockLeaderboard;
  }
);

const hunterSlice = createSlice({
  name: 'hunter',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<HunterProfile>) => {
      state.profile = action.payload;
    },
    
    updateProfileField: (state, action: PayloadAction<{ field: keyof HunterProfile; value: any }>) => {
      if (state.profile) {
        (state.profile as any)[action.payload.field] = action.payload.value;
      }
    },
    
    addExperience: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.experience += action.payload;
        
        // Check for level up
        while (state.profile.experience >= state.profile.experienceToNext) {
          state.profile.experience -= state.profile.experienceToNext;
          state.profile.level += 1;
          state.profile.experienceToNext = state.profile.level * 100; // Simple progression
          
          // Update rank based on level
          if (state.profile.level >= 20) state.profile.rank = 'Master Hunter';
          else if (state.profile.level >= 15) state.profile.rank = 'Expert';
          else if (state.profile.level >= 10) state.profile.rank = 'Adventurer';
          else if (state.profile.level >= 5) state.profile.rank = 'Explorer';
          else state.profile.rank = 'Beginner';
        }
      }
    },
    
    incrementTreasuresFound: (state) => {
      if (state.profile) {
        state.profile.totalTreasuresFound += 1;
        state.profile.currentStreak += 1;
        state.profile.stats.treasuresFoundToday += 1;
        state.profile.stats.treasuresFoundThisWeek += 1;
        state.profile.stats.treasuresFoundThisMonth += 1;
        
        if (state.profile.currentStreak > state.profile.longestStreak) {
          state.profile.longestStreak = state.profile.currentStreak;
        }
        
        state.profile.lastActiveAt = new Date().toISOString();
      }
    },
    
    resetStreak: (state) => {
      if (state.profile) {
        state.profile.currentStreak = 0;
      }
    },
    
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      if (state.profile) {
        const exists = state.profile.achievements.find(a => a.id === action.payload.id);
        if (!exists) {
          state.profile.achievements.push(action.payload);
        }
      }
    },
    
    updateStats: (state, action: PayloadAction<Partial<HunterStats>>) => {
      if (state.profile) {
        state.profile.stats = { ...state.profile.stats, ...action.payload };
      }
    },
    
    updatePreferences: (state, action: PayloadAction<Partial<HunterPreferences>>) => {
      if (state.profile) {
        state.profile.preferences = { ...state.profile.preferences, ...action.payload };
      }
    },
    
    addFriend: (state, action: PayloadAction<HunterProfile>) => {
      const exists = state.friends.find(f => f.id === action.payload.id);
      if (!exists) {
        state.friends.push(action.payload);
      }
    },
    
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter(f => f.id !== action.payload);
    },
    
    setNearbyHunters: (state, action: PayloadAction<HunterProfile[]>) => {
      state.nearbyHunters = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetHunterState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Profile
      .addCase(createHunterProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHunterProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(createHunterProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create profile';
      })
      
      // Update Profile
      .addCase(updateHunterProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateHunterProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        }
      })
      .addCase(updateHunterProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update profile';
      })
      
      // Load Leaderboard
      .addCase(loadLeaderboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaderboard = action.payload;
      })
      .addCase(loadLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load leaderboard';
      });
  },
});

export const {
  setProfile,
  updateProfileField,
  addExperience,
  incrementTreasuresFound,
  resetStreak,
  addAchievement,
  updateStats,
  updatePreferences,
  addFriend,
  removeFriend,
  setNearbyHunters,
  setError,
  clearError,
  resetHunterState,
} = hunterSlice.actions;

export default hunterSlice.reducer;