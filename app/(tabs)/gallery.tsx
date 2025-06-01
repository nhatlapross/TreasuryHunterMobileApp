// app/(tabs)/gallery.tsx - Fixed to use apiService for NFT collection
import { useWallet } from '@/hooks/useWallet';
import { apiService } from '@/services/APIService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface TreasureNFT {
  id: string;
  nftObjectId: string;
  treasureId: string;
  name: string;
  description: string;
  rarity: number;
  rarityName: string;
  imageUrl: string;
  discoveredAt: string;
  onChain: boolean;
  explorerUrl?: string;
  location?: string;
  transactionDigest?: string;
}

interface NFTStats {
  total: number;
  onChain: number;
  byRarity: Record<string, number>;
}

export default function GalleryScreen() {
  const { nfts, loading: walletLoading, getNFTCollection } = useWallet();
  const [treasureNFTs, setTreasureNFTs] = useState<TreasureNFT[]>([]);
  const [nftStats, setNftStats] = useState<NFTStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<TreasureNFT | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterRarity, setFilterRarity] = useState<number | null>(null);
  const [discoveries, setDiscoveries] = useState<any[]>([]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadNFTData();
  }, []);

  const loadNFTData = async () => {
    try {
      setLoading(true);
      console.log('🖼️ Loading NFT collection...');

      // Load NFTs from wallet service
      const nftData = await getNFTCollection();
      
      if (nftData && nftData.nfts) {
        setTreasureNFTs(nftData.nfts);
        setNftStats(nftData.stats);
        console.log(`✅ Loaded ${nftData.nfts.length} NFTs`);
      }

      // Also load discovery history for additional context
      await loadDiscoveries();

    } catch (error) {
      console.error('❌ Failed to load NFT data:', error);
      Alert.alert('Error', 'Failed to load your NFT collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDiscoveries = async () => {
    try {
      console.log('📜 Loading discovery history...');
      
      const response = await apiService.getDiscoveryHistory(1, 50); // Get more discoveries
      
      if (response.success && response.data) {
        setDiscoveries(response.data.discoveries);
        console.log(`✅ Loaded ${response.data.discoveries.length} discoveries`);
      }
    } catch (error) {
      console.error('❌ Failed to load discoveries:', error);
      // Don't show alert for discoveries, as it's supplementary data
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNFTData();
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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDiscoveryContext = (treasureId: string) => {
    return discoveries.find(d => d.treasure?.treasureId === treasureId);
  };

  const handleViewOnExplorer = (nft: TreasureNFT) => {
    if (nft.explorerUrl) {
      Alert.alert(
        'View on Sui Explorer',
        `Would open: ${nft.explorerUrl}`,
        [
          { text: 'Cancel' },
          { text: 'Open', onPress: () => console.log('Opening explorer...') }
        ]
      );
    } else {
      Alert.alert('Info', 'Explorer URL not available for this NFT');
    }
  };

  const handleShareNFT = (nft: TreasureNFT) => {
    const shareText = `Check out my treasure NFT! 🎉\n\n💎 ${nft.name}\n🏆 Rarity: ${nft.rarityName}\n📅 Discovered: ${formatDate(nft.discoveredAt)}\n\n#TreasureHunt #NFT #SuiBlockchain`;
    
    Alert.alert(
      'Share NFT',
      shareText,
      [
        { text: 'Cancel' },
        { text: 'Share', onPress: () => console.log('Sharing NFT...') }
      ]
    );
  };

  // Filter NFTs based on rarity
  const filteredNFTs = filterRarity 
    ? treasureNFTs.filter(nft => nft.rarity === filterRarity)
    : treasureNFTs;

  const renderNFTCard = ({ item }: { item: TreasureNFT }) => {
    const discoveryContext = getDiscoveryContext(item.treasureId);
    
    return (
      <TouchableOpacity
        style={[styles.nftCard, { borderColor: getRarityColor(item.rarity) }]}
        onPress={() => {
          setSelectedNFT(item);
          setModalVisible(true);
        }}
      >
        {/* NFT Image */}
        <View style={styles.nftImageContainer}>
          {item.imageUrl && item.imageUrl !== 'https://via.placeholder.com/300' ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.nftImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: getRarityColor(item.rarity) + '20' }]}>
              <Ionicons name="diamond" size={40} color={getRarityColor(item.rarity)} />
            </View>
          )}
          
          {/* Blockchain Status Badge */}
          <View style={[
            styles.blockchainBadge,
            { backgroundColor: item.onChain ? '#10b981' : '#f59e0b' }
          ]}>
            <Ionicons 
              name={item.onChain ? "checkmark" : "time"} 
              size={12} 
              color="#fff" 
            />
          </View>
        </View>

        {/* NFT Info */}
        <View style={styles.nftInfo}>
          <Text style={styles.nftName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.rarityBadge}>
            <View style={[styles.rarityDot, { backgroundColor: getRarityColor(item.rarity) }]} />
            <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
              {item.rarityName}
            </Text>
          </View>
          
          {discoveryContext?.treasure?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {discoveryContext.treasure.location}
              </Text>
            </View>
          )}
          
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color="#666" />
            <Text style={styles.dateText}>
              {formatDate(item.discoveredAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (rarity: number | null, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterRarity === rarity && styles.activeFilterButton,
        rarity ? { borderColor: getRarityColor(rarity) } : undefined
      ]}
      onPress={() => setFilterRarity(rarity)}
    >
      <Text style={[
        styles.filterButtonText,
        filterRarity === rarity && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
      {rarity && nftStats?.byRarity?.[getRarityText(rarity)] && (
        <Text style={styles.filterCount}>
          {nftStats.byRarity[getRarityText(rarity)]}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color="#666" />
      <Text style={styles.emptyTitle}>No Treasures Yet</Text>
      <Text style={styles.emptyText}>
        Start hunting to discover your first treasure NFT!
      </Text>
      <TouchableOpacity style={styles.startHuntingButton}>
        <Text style={styles.startHuntingText}>Start Hunting</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{nftStats?.total || 0}</Text>
        <Text style={styles.statLabel}>Total NFTs</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{nftStats?.onChain || 0}</Text>
        <Text style={styles.statLabel}>On Chain</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {nftStats?.byRarity?.['Legendary'] || 0}
        </Text>
        <Text style={styles.statLabel}>Legendary</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Treasure Collection</Text>
          <Text style={styles.subtitle}>
            {treasureNFTs.length} treasure{treasureNFTs.length !== 1 ? 's' : ''} discovered
          </Text>
        </View>
        
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Stats Header */}
      {nftStats && renderStatsHeader()}

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {renderFilterButton(null, 'All')}
        {renderFilterButton(1, 'Common')}
        {renderFilterButton(2, 'Rare')}
        {renderFilterButton(3, 'Legendary')}
      </ScrollView>

      {/* Loading State */}
      {(loading || walletLoading) && treasureNFTs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your treasures...</Text>
        </View>
      ) : (
        /* NFT Grid */
        <FlatList
          data={filteredNFTs}
          renderItem={renderNFTCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.nftGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* NFT Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {selectedNFT && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* NFT Image */}
                <View style={styles.modalImageContainer}>
                  {selectedNFT.imageUrl && selectedNFT.imageUrl !== 'https://via.placeholder.com/300' ? (
                    <Image
                      source={{ uri: selectedNFT.imageUrl }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.modalPlaceholder, { backgroundColor: getRarityColor(selectedNFT.rarity) + '20' }]}>
                      <Ionicons name="diamond" size={60} color={getRarityColor(selectedNFT.rarity)} />
                    </View>
                  )}
                </View>
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalTitle}>{selectedNFT.name}</Text>
                  
                  <View style={styles.modalRarityBadge}>
                    <View style={[styles.rarityDot, { backgroundColor: getRarityColor(selectedNFT.rarity) }]} />
                    <Text style={[styles.modalRarityText, { color: getRarityColor(selectedNFT.rarity) }]}>
                      {selectedNFT.rarityName}
                    </Text>
                    <View style={[
                      styles.chainStatusBadge,
                      { backgroundColor: selectedNFT.onChain ? '#10b981' : '#f59e0b' }
                    ]}>
                      <Text style={styles.chainStatusText}>
                        {selectedNFT.onChain ? 'On Chain' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalDescription}>{selectedNFT.description}</Text>

                  {/* Discovery Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Discovery Details</Text>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={20} color="#6366f1" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Discovered</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(selectedNFT.discoveredAt)}
                        </Text>
                      </View>
                    </View>

                    {getDiscoveryContext(selectedNFT.treasureId)?.treasure?.location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#6366f1" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Location</Text>
                          <Text style={styles.detailValue}>
                            {getDiscoveryContext(selectedNFT.treasureId)?.treasure?.location}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Blockchain Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Blockchain Details</Text>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="finger-print-outline" size={20} color="#6366f1" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>NFT Object ID</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {selectedNFT.nftObjectId}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="link-outline" size={20} color="#6366f1" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Treasure ID</Text>
                        <Text style={styles.detailValue}>
                          {selectedNFT.treasureId}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#6366f1" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[
                          styles.detailValue,
                          { color: selectedNFT.onChain ? '#10b981' : '#f59e0b' }
                        ]}>
                          {selectedNFT.onChain ? 'Verified on Sui Blockchain' : 'Pending Blockchain Verification'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {selectedNFT.onChain && selectedNFT.explorerUrl && (
                      <TouchableOpacity
                        style={styles.explorerButton}
                        onPress={() => handleViewOnExplorer(selectedNFT)}
                      >
                        <Ionicons name="open-outline" size={20} color="#6366f1" />
                        <Text style={styles.explorerButtonText}>View on Explorer</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleShareNFT(selectedNFT)}
                    >
                      <Ionicons name="share-outline" size={20} color="#fff" />
                      <Text style={styles.shareButtonText}>Share NFT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  filterContainer: {
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center',
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
  nftGrid: {
    padding: 20,
  },
  nftCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    margin: 5,
    overflow: 'hidden',
  },
  nftImageContainer: {
    position: 'relative',
  },
  nftImage: {
    width: '100%',
    height: 150,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockchainBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  startHuntingButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startHuntingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  modalImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 16,
  },
  modalPlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalRarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  modalRarityText: {
    fontSize: 18,
    fontWeight: '600',
  },
  chainStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chainStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  detailSection: {
    marginBottom: 25,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailContent: {
    marginLeft: 15,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 15,
    marginTop: 20,
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 10,
  },
  explorerButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});