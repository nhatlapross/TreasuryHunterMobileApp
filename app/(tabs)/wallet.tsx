// app/(tabs)/wallet.tsx - Wallet Screen with useWallet Hook Integration
import { useWallet } from '@/hooks/useWallet';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WalletInfo {
  address: string;
  network: string;
  username: string;
  hasBlockchainProfile: boolean;
  totalTransactions: number;
  totalEarned: number;
  totalEarnedSui: string;
}

export default function WalletScreen() {
  const {
    balance,
    suiBalance,
    nfts,
    transactions,
    loading,
    error,
    getWalletBalance,
    getNFTCollection,
    getTransactionHistory,
    requestFaucet,
  } = useWallet();

  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [requestingFaucet, setRequestingFaucet] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('🔄 Loading wallet data...');
      
      // Load wallet balance and info
      const balanceData = await getWalletBalance();
      
      // Load additional wallet info
      if (balanceData) {
        setWalletInfo({
          address: balanceData.wallet.address,
          network: balanceData.wallet.network,
          username: balanceData.user.username,
          hasBlockchainProfile: balanceData.user.hasBlockchainProfile,
          totalTransactions: balanceData.stats.totalTransactions,
          totalEarned: balanceData.stats.totalEarned,
          totalEarnedSui: balanceData.stats.totalEarnedSui,
        });
      }

      // Load transactions
      await getTransactionHistory(1, 10);

      console.log('✅ Wallet data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getWalletBalance(),
        getTransactionHistory(1, 10),
        getNFTCollection(),
      ]);
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyAddressToClipboard = async () => {
    if (walletInfo?.address) {
      await Clipboard.setString(walletInfo.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const shareAddress = async () => {
    if (walletInfo?.address) {
      try {
        await Share.share({
          message: `My Sui Wallet Address: ${walletInfo.address}`,
          title: 'My Wallet Address'
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleFaucetRequest = async () => {
    if (walletInfo?.network === 'mainnet') {
      Alert.alert('Faucet Unavailable', 'Faucet is only available on testnet');
      return;
    }

    try {
      setRequestingFaucet(true);
      console.log('🚰 Requesting faucet...');

      const result = await requestFaucet();
      
      Alert.alert(
        '🎉 Success!',
        `Received ${result.newBalanceSui} SUI from faucet!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Faucet request failed:', error);
      Alert.alert('Faucet Error', error instanceof Error ? error.message : 'Failed to request SUI from faucet');
    } finally {
      setRequestingFaucet(false);
    }
  };

  const openTransactionDetails = (transaction: any) => {
    const details = [
      `Type: ${transaction.typeDisplay}`,
      `Amount: ${transaction.amountSui} SUI`,
      `Status: ${transaction.statusDisplay}`,
      `Date: ${new Date(transaction.createdAt).toLocaleDateString()}`,
    ];

    if (transaction.digest) {
      details.push(`Hash: ${transaction.digest.slice(0, 20)}...`);
    }

    const buttons: any[] = [
      { text: 'Close', style: 'cancel' }
    ];

    if (transaction.explorerUrl) {
      buttons.push({
        text: 'View on Explorer',
        onPress: () => {
          Alert.alert('Info', 'Would open Sui Explorer in browser');
        }
      });
    }

    Alert.alert('Transaction Details', details.join('\n'), buttons);
  };

  const formatAddress = (address: string) => {
    if (showFullAddress) {
      return address;
    }
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTransactionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'treasure_reward': return 'trophy';
      case 'transfer': return 'arrow-up';
      case 'faucet': return 'arrow-down';
      case 'admin': return 'settings';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'treasure_reward': return '#f59e0b';
      case 'transfer': return '#ef4444';
      case 'faucet': return '#10b981';
      case 'admin': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Show loading state
  if (loading && !walletInfo) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  // Show error state
  if (error && !walletInfo) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="wallet-outline" size={80} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Wallet</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={32} color="#6366f1" />
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>
          
          <Text style={styles.balanceAmount}>{suiBalance} SUI</Text>
          <Text style={styles.balanceUsd}>≈ ${(parseFloat(suiBalance) * 1.50).toFixed(2)} USD</Text>

          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="arrow-down" size={20} color="#10b981" />
              <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="arrow-up" size={20} color="#ef4444" />
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Send</Text>
            </TouchableOpacity>
            
            {walletInfo?.network === 'testnet' && (
              <TouchableOpacity 
                style={[styles.actionButton, requestingFaucet && styles.actionButtonDisabled]} 
                onPress={handleFaucetRequest}
                disabled={requestingFaucet}
              >
                {requestingFaucet ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Ionicons name="water" size={20} color="#6366f1" />
                )}
                <Text style={[styles.actionButtonText, { color: '#6366f1' }]}>
                  {requestingFaucet ? 'Requesting...' : 'Faucet'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
              <Ionicons name="share-outline" size={20} color="#6366f1" />
              <Text style={[styles.actionButtonText, { color: '#6366f1' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Address Section */}
        {walletInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Address</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Your Sui Address</Text>
                <TouchableOpacity 
                  style={styles.addressContainer}
                  onPress={() => setShowFullAddress(!showFullAddress)}
                >
                  <Text style={styles.addressText}>
                    {formatAddress(walletInfo.address)}
                  </Text>
                  <Ionicons 
                    name={showFullAddress ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.addressActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={copyAddressToClipboard}
                >
                  <Ionicons name="copy-outline" size={20} color="#6366f1" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={shareAddress}
                >
                  <Ionicons name="share-outline" size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.transactionsContainer}>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionCard}
                  onPress={() => openTransactionDetails(transaction)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: `${getTransactionColor(transaction.type)}20` }
                    ]}>
                      <Ionicons 
                        name={getTransactionIcon(transaction.type)} 
                        size={20} 
                        color={getTransactionColor(transaction.type)} 
                      />
                    </View>
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription} numberOfLines={1}>
                        {transaction.typeDisplay}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionTime}>
                          {formatDate(transaction.createdAt)}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(transaction.status)}20` }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(transaction.status) }
                          ]}>
                            {transaction.statusDisplay}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: getTransactionColor(transaction.type) }
                    ]}>
                      {transaction.type === 'transfer' ? '-' : '+'}{transaction.amountSui} SUI
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={60} color="#666" />
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptyText}>
                  Your transaction history will appear here
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Wallet Stats */}
        {walletInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color="#10b981" />
                <Text style={styles.statValue}>+12.5%</Text>
                <Text style={styles.statLabel}>24h Change</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
                <Text style={styles.statValue}>{walletInfo.totalEarnedSui}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="swap-horizontal" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{walletInfo.totalTransactions}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="diamond" size={24} color="#8b5cf6" />
                <Text style={styles.statValue}>{nfts.length}</Text>
                <Text style={styles.statLabel}>NFTs Owned</Text>
              </View>
            </View>
          </View>
        )}

        {/* Network Info */}
        {walletInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network Info</Text>
            <View style={styles.networkCard}>
              <View style={styles.networkInfo}>
                <Ionicons name="globe-outline" size={24} color="#6366f1" />
                <View style={styles.networkDetails}>
                  <Text style={styles.networkLabel}>Network</Text>
                  <Text style={styles.networkValue}>
                    {walletInfo.network.charAt(0).toUpperCase() + walletInfo.network.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.networkStatus,
                { backgroundColor: walletInfo.network === 'testnet' ? '#f59e0b20' : '#10b98120' }
              ]}>
                <Text style={[
                  styles.networkStatusText,
                  { color: walletInfo.network === 'testnet' ? '#f59e0b' : '#10b981' }
                ]}>
                  {walletInfo.network === 'testnet' ? 'Test Network' : 'Main Network'}
                </Text>
              </View>
            </View>
          </View>
        )}

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
    backgroundColor: '#0f0f0f',
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
    backgroundColor: '#0f0f0f',
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
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  balanceUsd: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    minHeight: 60,
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
    flex: 1,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionsContainer: {
    gap: 8,
  },
  transactionCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTime: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
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
  networkCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkDetails: {
    marginLeft: 12,
  },
  networkLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  networkValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  networkStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 50,
  },
});