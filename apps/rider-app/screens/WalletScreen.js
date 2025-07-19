import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { apiRequest } from '../utils/api';
import { useAuth } from '../auth/AuthContext';

export default function WalletScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState({
    balance: 0,
    cashback: 0,
    points: 0,
    transactions: []
  });
  const { user } = useAuth();

  const fetchWalletData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch wallet balance and transactions
      const [balanceData, transactionsData] = await Promise.all([
        apiRequest('/api/payments/wallet/balance', { method: 'GET', auth: true }),
        apiRequest('/api/payments/transactions', { method: 'GET', auth: true })
      ]);
      
      setWalletData({
        balance: balanceData.balance || 0,
        cashback: balanceData.cashback || 0,
        points: balanceData.points || 0,
        transactions: transactionsData || []
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchWalletData(true);
  };

  const handleAddMoney = () => {
    Alert.alert(
      'Add Money',
      'This feature will be available soon. You can add money to your wallet for seamless payments.',
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Wallet</Text>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <Card style={styles.balanceCard} left={<Ionicons name="wallet" size={32} color={Colors.primary} />}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balance}>${walletData.balance.toFixed(2)}</Text>
            <Button title="Add Money" icon="add" style={styles.addBtn} onPress={handleAddMoney} />
          </Card>
          
          <View style={styles.statsRow}>
            <Card style={styles.statCard} left={<Ionicons name="gift" size={20} color={Colors.reward || Colors.primary} />}>
              <Text style={styles.statLabel}>Cashback</Text>
              <Text style={styles.statValue}>${walletData.cashback.toFixed(2)}</Text>
            </Card>
            <Card style={styles.statCard} left={<Ionicons name="star" size={20} color={Colors.reward || Colors.primary} />}>
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>{walletData.points}</Text>
            </Card>
          </View>
          
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <ScrollView 
            style={styles.txList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
              />
            }
          >
            {walletData.transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
              </View>
            ) : (
              walletData.transactions.map((tx) => (
                <Card key={tx.id} style={styles.txCard} left={<Ionicons name={tx.type === 'ride' ? 'car-outline' : 'wallet-outline'} size={20} color={Colors.primary} />}>
                  <Text style={styles.txDesc}>{tx.description || tx.type}</Text>
                  <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success || '#4CAF50' : Colors.error || '#F44336' }]}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </Card>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 32,
  },
  header: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  balance: {
    ...Typography.h1,
    color: Colors.primary,
    marginVertical: 4,
  },
  addBtn: {
    marginTop: Spacing.sm,
    width: 140,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statValue: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  txList: {
    flex: 1,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  txDesc: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  txAmount: {
    ...Typography.bodyBold,
    marginLeft: 8,
    marginRight: 8,
  },
  txDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
}); 