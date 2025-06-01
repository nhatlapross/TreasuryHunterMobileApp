// app/(tabs)/index.tsx - Fixed to use apiService and hooks
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTreasures } from '@/hooks/useTreasures';
import { useWallet } from '@/hooks/useWallet';
import { apiService } from '@/services/APIService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Components
import { ActionButton } from '@/components/ui/ActionButton';
import { StatsCard } from '@/components/ui/StatsCard';
import { TreasureCard } from '@/components/ui/TreasureCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface NearbyTreasure {
  treasureId: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  rarity: number;
  rarityName: string;
  distance: number;
  canHunt: boolean;
  imageUrl: string;
  requiredRank: number;
  requiredRankName: string;
  rewardPoints: number;
}

interface DashboardStats {
  totalTreasures: number;
  foundToday: number;
  currentStreak: number;
  rank: string;
  totalScore: number;
  balanceSui: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, wallet } = useAuth();
  const { profileStats, getProfileStats } = useProfile();
  const { treasures, loading: treasuresLoading, getNearbyTreasures } = useTreasures();
  const { suiBalance, getWalletBalance } = useWallet();

  const [nearbyTreasures, setNearbyTreasures] = useState<NearbyTreasure[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTreasures: 0,
    foundToday: 0,
    currentStreak: 0,
    rank: 'Beginner',
    totalScore: 0,
    balanceSui: '0.0000'
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeHomePage();
  }, []);

  const initializeHomePage = async () => {
    try {
      setLoading(true);
      console.log('🏠 Initializing homepage...');

      // Load user location and dashboard data in parallel
      await Promise.all([
        getCurrentLocation(),
        loadDashboardData()
      ]);

    } catch (error) {
      console.error('❌ Failed to initialize homepage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('📍 Getting current location...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is required to find nearby treasures');
        // Use default Hanoi coordinates
        const defaultLocation = {
          coords: { latitude: 21.0285, longitude: 105.8542 }
        } as Location.LocationObject;
        setLocation(defaultLocation);
        await loadNearbyTreasures(defaultLocation);
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      setLocation(locationResult);
      setLocationError(null);
      await loadNearbyTreasures(locationResult);

      console.log(`✅ Location: ${locationResult.coords.latitude}, ${locationResult.coords.longitude}`);

    } catch (error) {
      console.error('❌ Location error:', error);
      setLocationError('Could not get location');
      
      // Fallback to default location
      const defaultLocation = {
        coords: { latitude: 21.0285, longitude: 105.8542 }
      } as Location.LocationObject;
      setLocation(defaultLocation);
      await loadNearbyTreasures(defaultLocation);
    }
  };

  const loadNearbyTreasures = async (locationResult: Location.LocationObject) => {
    try {
      console.log('🗺️ Loading nearby treasures...');
      
      const treasureData = await getNearbyTreasures(
        locationResult.coords.latitude,
        locationResult.coords.longitude,
        5000 // 5km radius
      );

      if (treasureData && treasureData.treasures) {
        setNearbyTreasures(treasureData.treasures);
        console.log(`✅ Found ${treasureData.treasures.length} nearby treasures`);
      }

    } catch (error) {
      console.error('❌ Failed to load nearby treasures:', error);
      // Don't show alert here, just log the error
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');

      // Load profile stats and wallet balance
      const [profileData, walletData] = await Promise.all([
        getProfileStats().catch(err => {
          console.warn('Profile stats failed:', err);
          return null;
        }),
        getWalletBalance().catch(err => {
          console.warn('Wallet balance failed:', err);
          return null;
        })
      ]);

      // Calculate found today (this would need to be implemented in the backend)
      const foundToday = await calculateFoundToday();

      // Update dashboard stats
      setDashboardStats({
        totalTreasures: profileData?.profile?.totalTreasuresFound || 0,
        foundToday,
        currentStreak: profileData?.profile?.currentStreak || 0,
        rank: profileData?.profile?.rank || 'Beginner',
        totalScore: profileData?.profile?.totalScore || 0,
        balanceSui: walletData?.wallet?.suiBalance || suiBalance || '0.0000'
      });

      console.log('✅ Dashboard data loaded');

    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    }
  };

  const calculateFoundToday = async (): Promise<number> => {
    try {
      // Get discovery history for today
      const response = await apiService.getDiscoveryHistory(1, 50);
      
      if (response.success && response.data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const foundToday = response.data.discoveries.filter((discovery: any) => {
          const discoveryDate = new Date(discovery.discoveredAt);
          discoveryDate.setHours(0, 0, 0, 0);
          return discoveryDate.getTime() === today.getTime();
        }).length;

        return foundToday;
      }
    } catch (error) {
      console.warn('❌ Failed to calculate found today:', error);
    }
    
    return 0;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getCurrentLocation(),
        loadDashboardData()
      ]);
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 3: return '#ffd700'; // Legendary - Gold
      case 2: return '#c084fc'; // Rare - Purple
      case 1: return '#10b981'; // Common - Green
      default: return '#6b7280'; // Unknown - Gray
    }
  };

  const getRarityText = (rarity: number) => {
    switch (rarity) {
      case 3: return 'Legendary';
      case 2: return 'Rare';
      case 1: return 'Common';
      default: return 'Unknown';
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const navigateToTreasure = (treasure: NearbyTreasure) => {
    if (treasure.distance > 5000) {
      Alert.alert(
        'Too Far Away',
        'You need to be closer to this treasure to hunt it. Get within 5km to start hunting!',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/hunt',
      params: { treasureId: treasure.treasureId }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'hunt':
        router.push('/(tabs)/hunt');
        break;
      case 'gallery':
        router.push('/(tabs)/gallery');
        break;
      case 'wallet':
        router.push('/(tabs)/wallet');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const requestLocationPermission = async () => {
    Alert.alert(
      'Location Permission Required',
      'We need access to your location to find nearby treasures. Would you like to grant permission?',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Enable Location', 
          onPress: getCurrentLocation
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#0f0f0f' }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1a1a1a', '#0f0f0f']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
              <Text style={styles.subtitle}>
                {user?.username ? `Welcome back, ${user.username}` : 'Ready for your next adventure?'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => handleQuickAction('profile')}
            >
              <Ionicons name="person-circle" size={40} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Dashboard Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              icon="trophy"
              number={dashboardStats.totalTreasures}
              label="Total Found"
              gradient={['#f59e0b', '#f97316']}
            />

            <StatsCard
              icon="today"
              number={dashboardStats.foundToday}
              label="Found Today"
              gradient={['#10b981', '#059669']}
            />

            <StatsCard
              icon="flame"
              number={dashboardStats.currentStreak}
              label="Day Streak"
              gradient={['#ef4444', '#dc2626']}
            />
          </View>

          <TouchableOpacity
            style={styles.rankCard}
            onPress={() => handleQuickAction('profile')}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.rankIcon}
            >
              <Ionicons name="ribbon" size={32} color="#fff" />
            </LinearGradient>
            <View style={styles.rankInfo}>
              <Text style={styles.rankTitle}>Current Rank</Text>
              <Text style={styles.rankText}>{dashboardStats.rank}</Text>
              <Text style={styles.rankSubtext}>
                {dashboardStats.totalScore.toLocaleString()} points
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <ActionButton
              icon="search"
              label="Start Hunt"
              onPress={() => handleQuickAction('hunt')}
            />

            <ActionButton
              icon="images"
              label="My Collection"
              onPress={() => handleQuickAction('gallery')}
            />

            <ActionButton
              icon="wallet"
              label="Wallet"
              onPress={() => handleQuickAction('wallet')}
            />
          </View>
        </View>

        {/* Wallet Balance Quick View */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.walletQuickView}
            onPress={() => handleQuickAction('wallet')}
          >
            <View style={styles.walletInfo}>
              <Ionicons name="wallet" size={24} color="#10b981" />
              <View style={styles.walletDetails}>
                <Text style={styles.walletLabel}>SUI Balance</Text>
                <Text style={styles.walletBalance}>{dashboardStats.balanceSui} SUI</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Location Status */}
        {locationError && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.locationError}
              onPress={requestLocationPermission}
            >
              <Ionicons name="location-outline" size={24} color="#ef4444" />
              <View style={styles.locationErrorContent}>
                <Text style={styles.locationErrorTitle}>Location Access Needed</Text>
                <Text style={styles.locationErrorText}>
                  Enable location to find nearby treasures
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby Treasures */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Treasures</Text>
            <TouchableOpacity 
              onPress={getCurrentLocation}
              disabled={treasuresLoading}
            >
              {treasuresLoading ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Ionicons name="refresh" size={20} color="#6366f1" />
              )}
            </TouchableOpacity>
          </View>

          {location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color="#10b981" />
              <Text style={styles.locationText}>
                {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {loading || treasuresLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Finding nearby treasures...</Text>
            </View>
          ) : nearbyTreasures.length > 0 ? (
            <View style={styles.treasuresContainer}>
              {nearbyTreasures.slice(0, 5).map((treasure) => (
                <TreasureCard
                  key={treasure.treasureId}
                  treasure={treasure}
                  onPress={() => navigateToTreasure(treasure)}
                  getRarityColor={getRarityColor}
                  getRarityText={getRarityText}
                  formatDistance={formatDistance}
                />
              ))}
              
              {nearbyTreasures.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => handleQuickAction('hunt')}
                >
                  <Text style={styles.viewAllText}>
                    View all {nearbyTreasures.length} treasures
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#6366f1" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="telescope" size={60} color="#666" />
              <Text style={styles.emptyTitle}>No Treasures Nearby</Text>
              <Text style={styles.emptyText}>
                {location 
                  ? 'Try moving to a different location or check back later!'
                  : 'Enable location services to find treasures near you'
                }
              </Text>
              {!location && (
                <TouchableOpacity 
                  style={styles.enableLocationButton}
                  onPress={requestLocationPermission}
                >
                  <Text style={styles.enableLocationText}>Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  profileButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    gap: 15,
  },
  rankIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  rankSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  walletQuickView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletDetails: {
    marginLeft: 15,
  },
  walletLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  locationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  locationErrorContent: {
    flex: 1,
    marginLeft: 15,
  },
  locationErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  locationErrorText: {
    fontSize: 14,
    color: '#888',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 15,
  },
  treasuresContainer: {
    gap: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  enableLocationButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  enableLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
});