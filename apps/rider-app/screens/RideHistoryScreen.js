import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Card from '../components/ui/Card';
import { apiRequest } from '../utils/api';
import { useAuth } from '../auth/AuthContext';

export default function RideHistoryScreen() {
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const { user } = useAuth();

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await apiRequest('/api/rides', { 
        method: 'GET', 
        auth: true,
        params: { user_id: user?.id, status: 'completed' }
      });
      setHistory(data || []);
    } catch (err) {
      setError(err.message);
      // Provide mock data if network fails
      setHistory([
        {
          id: 1,
          origin: 'Downtown',
          destination: 'Airport',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          fare: 18.5,
          status: 'completed',
        },
        {
          id: 2,
          origin: 'Mall',
          destination: 'University',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          fare: 12.0,
          status: 'completed',
        },
        {
          id: 3,
          origin: 'Home',
          destination: 'Office',
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          fare: 9.75,
          status: 'completed',
        },
      ]);
      console.error('Error fetching ride history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchHistory(true);
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride History</Text>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ride history...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No Ride History</Text>
          <Text style={styles.emptySubtext}>Your completed rides will appear here</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {history.map((ride) => (
            <Card key={ride.id} style={styles.rideCard} left={<Ionicons name="car" size={24} color={Colors.primary} />}>
              <Text style={styles.rideRoute}>{ride.origin || 'Unknown'} → {ride.destination || 'Unknown'}</Text>
              <Text style={styles.rideInfo}>
                {new Date(ride.created_at || ride.requested_at).toLocaleDateString()} • 
                ${ride.fare || ride.estimated_fare || 'N/A'}
              </Text>
              <Text style={styles.rideStatus}>Status: {ride.status}</Text>
            </Card>
          ))}
        </ScrollView>
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
  list: {
    flex: 1,
  },
  rideCard: {
    marginBottom: 8,
  },
  rideRoute: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  rideInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rideStatus: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  rideRating: {
    color: Colors.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
}); 