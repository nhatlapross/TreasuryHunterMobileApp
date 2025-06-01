// hooks/useWallet.ts - Hook for wallet functionality
import { apiService } from '@/services/APIService';
import { useCallback, useState } from 'react';

interface NFT {
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
}

interface Transaction {
  id: string;
  digest: string;
  type: string;
  typeDisplay: string;
  amount: number;
  amountSui: string;
  status: string;
  statusDisplay: string;
  createdAt: string;
  explorerUrl?: string;
}

export const useWallet = () => {
  const [balance, setBalance] = useState<string>('0');
  const [suiBalance, setSuiBalance] = useState<string>('0.0000');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWalletBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getWalletBalance();

      if (response.success && response.data) {
        setBalance(response.data.wallet.balance);
        setSuiBalance(response.data.wallet.suiBalance);
        console.log(`💰 Wallet balance: ${response.data.wallet.suiBalance} SUI`);
        return response.data;
      } else {
        throw new Error('Failed to get wallet balance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get balance';
      setError(errorMessage);
      console.error('❌ Failed to get wallet balance:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNFTCollection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getNFTCollection();

      if (response.success && response.data) {
        setNfts(response.data.nfts);
        console.log(`🖼️ Found ${response.data.nfts.length} NFTs`);
        return response.data;
      } else {
        throw new Error('Failed to get NFT collection');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get NFTs';
      setError(errorMessage);
      console.error('❌ Failed to get NFT collection:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionHistory = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getTransactionHistory(page, limit);

      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        console.log(`📜 Found ${response.data.transactions.length} transactions`);
        return response.data;
      } else {
        throw new Error('Failed to get transaction history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get transactions';
      setError(errorMessage);
      console.error('❌ Failed to get transaction history:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestFaucet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚰 Requesting SUI from faucet...');

      const response = await apiService.requestWalletFaucet();

      if (response.success && response.data) {
        console.log(`✅ Faucet request successful: ${response.data.newBalanceSui} SUI`);
        setSuiBalance(response.data.newBalanceSui);
        return response.data;
      } else {
        throw new Error(response.message || 'Faucet request failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Faucet request failed';
      setError(errorMessage);
      console.error('❌ Faucet request failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
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
  };
};

