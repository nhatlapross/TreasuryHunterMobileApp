// app/(tabs)/profile.tsx - Updated with new Auth Context structure
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { apiService } from '@/services/APIService';
import { showLogoutConfirmation, showLogoutError } from '@/utils/logoutHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: string;
  totalTreasuresFound: number;
  totalScore: number;
  currentStreak: number;
  position: number;
  isCurrentUser: boolean;
}

export default function ProfileScreen() {
  const { user, wallet, logout, isLoggingOut } = useAuth();
  const { profileStats, loading, error, getProfileStats, updateProfile, createBlockchainProfile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      console.log('📊 Loading profile data...');
      
      // Load profile stats using the hook
      await getProfileStats();
      
      // Load achievements and leaderboard
      await Promise.all([
        loadAchievements(),
        loadLeaderboard()
      ]);
      
    } catch (error) {
      console.error('❌ Failed to load profile data:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      setLoadingAchievements(true);
      
      const response = await apiService.getAchievements();
      
      if (response.success && response.data) {
        setAchievements(response.data.achievements);
        console.log(`🏆 Loaded ${response.data.achievements.length} achievements`);
      }
    } catch (error) {
      console.error('❌ Failed to load achievements:', error);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      
      const response = await apiService.getLeaderboard(1, 10);
      
      if (response.success && response.data) {
        setLeaderboard(response.data.leaderboard);
        console.log(`🏅 Loaded leaderboard with ${response.data.leaderboard.length} entries`);
      }
    } catch (error) {
      console.error('❌ Failed to load leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfileData();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateBlockchainProfile = async () => {
    try {
      setCreatingProfile(true);
      
      const result = await createBlockchainProfile(user?.username);
      
      Alert.alert(
        '🎉 Success!',
        `Blockchain profile created successfully!\n\nProfile ID: ${result.profileObjectId}`,
        [
          {
            text: 'View on Explorer',
            onPress: () => {
              Alert.alert('Info', 'Would open Sui Explorer in browser');
            }
          },
          { text: 'OK' }
        ]
      );
      
      // Refresh profile data
      await getProfileStats();
      
    } catch (error) {
      console.error('❌ Failed to create blockchain profile:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create blockchain profile';
      
      if (errorMessage.includes('Insufficient SUI balance')) {
        Alert.alert(
          'Insufficient Balance',
          'You need at least 0.02 SUI to create a blockchain profile. Please request SUI from the faucet first.',
          [
            { text: 'OK' },
            {
              text: 'Go to Wallet',
              onPress: () => {
                Alert.alert('Info', 'Navigate to wallet tab to request SUI');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setCreatingProfile(false);
    }
  };

  const shareProfile = async () => {
    if (!profileStats) return;
    
    try {
      await Share.share({
        message: `Check out my treasure hunting progress! 🏴‍☠️\n\n🏅 Rank: ${profileStats.profile.rank}\n💎 Treasures Found: ${profileStats.profile.totalTreasuresFound}\n🔥 Current Streak: ${profileStats.profile.currentStreak}\n⭐ Score: ${profileStats.profile.totalScore.toLocaleString()}\n\nJoin me on the treasure hunt!`,
        title: 'My Treasure Hunting Stats'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const copyWalletAddress = () => {
    if (user?.suiAddress) {
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const handleLogout = () => {
    showLogoutConfirmation({
      title: 'Logout',
      message: 'Are you sure you want to logout? You will need to sign in again to access your account.',
      onConfirm: async () => {
        try {
          await logout();
        } catch (error) {
          showLogoutError(error as Error, handleLogout);
        }
      }
    });
  };

  const getRankInfo = (rank: string, totalTreasures: number) => {
    const ranks = {
      'beginner': { name: 'Beginner', next: 'Explorer', nextRequirement: 5, color: '#10b981' },
      'explorer': { name: 'Explorer', next: 'Hunter', nextRequirement: 20, color: '#3b82f6' },
      'hunter': { name: 'Hunter', next: 'Master', nextRequirement: 50, color: '#8b5cf6' },
      'master': { name: 'Master', next: null, nextRequirement: null, color: '#f59e0b' }
    };

    const rankInfo = ranks[rank.toLowerCase() as keyof typeof ranks] || ranks['beginner'];
    
    return {
      ...rankInfo,
      progress: rankInfo.nextRequirement ? 
        Math.min((totalTreasures / rankInfo.nextRequirement) * 100, 100) : 
        100,
      treasuresUntilNext: rankInfo.nextRequirement ? 
        Math.max(rankInfo.nextRequirement - totalTreasures, 0) : 
        0
    };
  };

  const getStreakInfo = (profile: any) => {
    if (!profile.lastHuntTimestamp) {
      return {
        isActive: false,
        status: 'No hunts yet',
        nextStreakAt: 'Start hunting to begin streak'
      };
    }

    const now = new Date();
    const lastHunt = new Date(profile.lastHuntTimestamp);
    const timeDiff = now.getTime() - lastHunt.getTime();
    const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    
    const isActive = daysDiff <= 1;
    const status = isActive ? 
      (daysDiff === 0 ? 'Active today' : 'Active (yesterday)') :
      'Streak broken';

    return {
      isActive,
      status,
      daysSinceLastHunt: daysDiff,
      nextStreakAt: isActive ? null : 'Start hunting to begin new streak'
    };
  };

  // Loading state
  if (loading && !profileStats) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !profileStats) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!profileStats || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#666" />
          <Text style={styles.errorText}>No profile data available</Text>
        </View>
      </View>
    );
  }

  const rankInfo = getRankInfo(profileStats.profile.rank, profileStats.profile.totalTreasuresFound);
  const streakInfo = getStreakInfo(profileStats.profile);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={80} color="#6366f1" />
            <View style={[styles.rankBadge, { backgroundColor: rankInfo.color }]}>
              <Ionicons name="ribbon" size={16} color="#fff" />
            </View>
          </View>
          
          <Text style={styles.username}>{user.username}</Text>
          <Text style={[styles.rank, { color: rankInfo.color }]}>{rankInfo.name}</Text>
          
          <TouchableOpacity style={styles.shareButton} onPress={shareProfile}>
            <Ionicons name="share-outline" size={20} color="#6366f1" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={30} color="#f59e0b" />
              <Text style={styles.statNumber}>{profileStats.profile.totalTreasuresFound}</Text>
              <Text style={styles.statLabel}>Treasures Found</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="flame" size={30} color="#ef4444" />
              <Text style={styles.statNumber}>{profileStats.profile.currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={30} color="#8b5cf6" />
              <Text style={styles.statNumber}>{profileStats.profile.totalScore.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={30} color="#10b981" />
              <Text style={styles.statNumber}>{profileStats.wallet.balanceSui}</Text>
              <Text style={styles.statLabel}>SUI Balance</Text>
            </View>
          </View>
        </View>

        {/* Rank Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rank Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={[styles.currentRank, { color: rankInfo.color }]}>{rankInfo.name}</Text>
              {rankInfo.next && (
                <Text style={styles.nextRank}>→ {rankInfo.next}</Text>
              )}
            </View>
            
            {rankInfo.nextRequirement ? (
              <>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(rankInfo.progress, 100)}%`, 
                      backgroundColor: rankInfo.color 
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {profileStats.profile.totalTreasuresFound} / {rankInfo.nextRequirement} treasures
                </Text>
              </>
            ) : (
              <Text style={styles.maxRankText}>🏆 Maximum rank achieved!</Text>
            )}
          </View>
        </View>

        {/* Streak Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hunt Streak</Text>
          <View style={styles.streakCard}>
            <View style={styles.streakInfo}>
              <Ionicons 
                name={streakInfo.isActive ? "flame" : "flame-outline"} 
                size={32} 
                color={streakInfo.isActive ? "#ef4444" : "#666"} 
              />
              <View style={styles.streakDetails}>
                <Text style={styles.streakNumber}>
                  {profileStats.profile.currentStreak} days
                </Text>
                <Text style={[
                  styles.streakStatus,
                  { color: streakInfo.isActive ? "#10b981" : "#f59e0b" }
                ]}>
                  {streakInfo.status}
                </Text>
              </View>
            </View>
            <View style={styles.streakMeta}>
              <Text style={styles.streakMetaText}>
                Longest: {profileStats.profile.longestStreak} days
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsContainer}>
            {loadingAchievements ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : achievements.filter(a => a.isUnlocked).length > 0 ? (
              achievements
                .filter(a => a.isUnlocked)
                .slice(0, 3)
                .map((achievement) => (
                  <View key={achievement.achievementId} style={styles.achievementBadge}>
                    <Ionicons name="medal" size={20} color="#f59e0b" />
                    <Text style={styles.achievementText}>{achievement.name}</Text>
                    <Text style={styles.achievementPoints}>+{achievement.points}</Text>
                  </View>
                ))
            ) : (
              <View style={styles.noAchievements}>
                <Ionicons name="trophy-outline" size={40} color="#666" />
                <Text style={styles.noAchievementsText}>No achievements yet</Text>
                <Text style={styles.noAchievementsSubtext}>Start hunting to unlock achievements!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Blockchain Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blockchain Profile</Text>
          {user.profileObjectId ? (
            <View style={styles.blockchainCard}>
              <View style={styles.blockchainInfo}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <View style={styles.blockchainDetails}>
                  <Text style={styles.blockchainLabel}>Blockchain Profile Active</Text>
                  <Text style={styles.blockchainValue} numberOfLines={1}>
                    {user.profileObjectId}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.blockchainButton}>
                <Text style={styles.blockchainButtonText}>View on Explorer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.blockchainCard}>
              <View style={styles.blockchainInfo}>
                <Ionicons name="warning" size={24} color="#f59e0b" />
                <View style={styles.blockchainDetails}>
                  <Text style={styles.blockchainLabel}>No Blockchain Profile</Text>
                  <Text style={styles.blockchainDescription}>
                    Create a profile on Sui blockchain to enable NFT rewards
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.blockchainButton, creatingProfile && styles.buttonDisabled]}
                onPress={handleCreateBlockchainProfile}
                disabled={creatingProfile}
              >
                {creatingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.blockchainButtonText}>Create Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Wallet Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <TouchableOpacity style={styles.walletCard} onPress={copyWalletAddress}>
            <View style={styles.walletInfo}>
              <Ionicons name="wallet" size={24} color="#6366f1" />
              <View style={styles.walletDetails}>
                <Text style={styles.walletLabel}>Sui Wallet Address</Text>
                <Text style={styles.walletAddress} numberOfLines={1}>
                  {user.suiAddress}
                </Text>
              </View>
            </View>
            <Ionicons name="copy-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Mini Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard Position</Text>
          <View style={styles.leaderboardContainer}>
            {loadingLeaderboard ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <>
                {profileStats.leaderboard.position && (
                  <View style={styles.positionCard}>
                    <Ionicons name="trophy" size={24} color="#f59e0b" />
                    <View style={styles.positionInfo}>
                      <Text style={styles.positionNumber}>#{profileStats.leaderboard.position}</Text>
                      <Text style={styles.positionLabel}>Your Position</Text>
                    </View>
                  </View>
                )}
                
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <View 
                    key={entry.userId} 
                    style={[
                      styles.leaderboardEntry,
                      entry.isCurrentUser && styles.currentUserEntry
                    ]}
                  >
                    <Text style={styles.leaderboardPosition}>#{entry.position}</Text>
                    <Text style={styles.leaderboardUsername}>{entry.username}</Text>
                    <Text style={styles.leaderboardScore}>{entry.totalScore}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#6366f1" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#6366f1" />
            <Text style={styles.settingText}>Security</Text>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.settingItem, isLoggingOut && styles.settingItemDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            )}
            <Text style={[styles.settingText, { color: '#ef4444' }]}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1a1a1a',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  rankBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 20,
    gap: 8,
  },
  shareButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  progressCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentRank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextRank: {
    fontSize: 14,
    color: '#888',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  maxRankText: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakDetails: {
    marginLeft: 15,
    flex: 1,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  streakStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  streakMeta: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  streakMetaText: {
    fontSize: 12,
    color: '#888',
  },
  achievementsContainer: {
    minHeight: 60,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  achievementText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  achievementPoints: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '600',
  },
  noAchievements: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAchievementsText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
  },
  noAchievementsSubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  blockchainCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockchainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockchainDetails: {
    marginLeft: 15,
    flex: 1,
  },
  blockchainLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  blockchainValue: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  blockchainDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  blockchainButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  blockchainButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  walletCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletDetails: {
    marginLeft: 15,
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  leaderboardContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  positionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  positionInfo: {
    marginLeft: 15,
  },
  positionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  positionLabel: {
    fontSize: 12,
    color: '#888',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  currentUserEntry: {
    backgroundColor: '#333',
  },
  leaderboardPosition: {
    fontSize: 14,
    color: '#888',
    width: 40,
  },
  leaderboardUsername: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    marginHorizontal: 15,
  },
  leaderboardScore: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  bottomSpacer: {
    height: 50,
  },
});