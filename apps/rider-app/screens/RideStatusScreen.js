import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../utils/api';
import socketService from '../utils/socket';

export default function RideStatusScreen({ route, navigation }) {
  const { 
    rideId, 
    rideData, 
    isScheduledRide, 
    scheduledFor: scheduledForString, 
    from, 
    to, 
    selectedRide, 
    estimatedDropoff: estimatedDropoffData,
    rideWithPet,
  } = route.params || {};
  
  // Convert ISO string dates back to Date objects
  const scheduledFor = scheduledForString ? new Date(scheduledForString) : null;
  const estimatedDropoff = estimatedDropoffData ? {
    ...estimatedDropoffData,
    dropoffTime: estimatedDropoffData.dropoffTime ? new Date(estimatedDropoffData.dropoffTime) : null,
  } : null;
  const { token } = useAuth();
  const [status, setStatus] = useState(isScheduledRide ? 'Scheduled' : 'Searching for driver...');
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideInfo, setRideInfo] = useState(rideData || {});
  const statusIntervalRef = useRef(null);

  useEffect(() => {
    if (!rideId) {
      Alert.alert('Error', 'No ride ID provided');
      navigation.goBack();
      return;
    }

    // Set up socket listeners
    const handleRideUpdate = (data) => {
      if (data.rideId === rideId) {
        setStatus(data.status || 'Searching for driver...');
        setRideInfo(prev => ({ ...prev, ...data }));
        if (data.driver) {
          setDriver(data.driver);
        }
      }
    };

    const handleLocationUpdate = (data) => {
      if (data.rideId === rideId && data.driverLocation) {
        setDriverLocation(data.driverLocation);
      }
    };

    const handleRideAccepted = (data) => {
      if (data.rideId === rideId) {
        setStatus('Driver accepted your ride');
        setDriver(data.driver);
        setRideInfo(prev => ({ ...prev, status: 'accepted' }));
      }
    };

    const handleRideCancelled = (data) => {
      if (data.rideId === rideId) {
        setStatus('Ride cancelled');
        Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
        navigation.goBack();
      }
    };

    const handleRideCompleted = (data) => {
      if (data.rideId === rideId) {
        setStatus('Ride completed');
        Alert.alert('Ride Completed', 'Your ride has been completed successfully!');
        navigation.navigate('RideHistory');
      }
    };

    // Subscribe to socket events
    socketService.on('ride:update', handleRideUpdate);
    socketService.on('location:update', handleLocationUpdate);
    socketService.on('ride:accepted', handleRideAccepted);
    socketService.on('ride:cancelled', handleRideCancelled);
    socketService.on('ride:completed', handleRideCompleted);

    // Initial fetch
    fetchRideStatus();

    // Set up polling for status updates
    statusIntervalRef.current = setInterval(fetchRideStatus, 5000);

    return () => {
      // Clean up socket listeners
      socketService.off('ride:update', handleRideUpdate);
      socketService.off('location:update', handleLocationUpdate);
      socketService.off('ride:accepted', handleRideAccepted);
      socketService.off('ride:cancelled', handleRideCancelled);
      socketService.off('ride:completed', handleRideCompleted);
      
      // Clear interval
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [rideId, token, navigation]);

  const fetchRideStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/rides/${rideId}`, { method: 'GET', auth: true });
      setStatus(data.status || 'Searching for driver...');
      setDriver(data.driver || null);
      setRideInfo(prev => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride Status</Text>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Scheduled Ride Info */}
          {isScheduledRide && (
            <Card style={styles.scheduledCard} left={<Ionicons name="calendar" size={32} color={Colors.warning} />}>
              <Text style={styles.scheduledTitle}>Scheduled Ride</Text>
              <Text style={styles.scheduledTime}>
                {formatTime(scheduledFor)} • {formatDate(scheduledFor)}
              </Text>
              <Text style={styles.scheduledLocation}>
                {from} → {to}
              </Text>
              {estimatedDropoff && (
                <Text style={styles.scheduledDuration}>
                  Estimated duration: {estimatedDropoff.formattedDuration}
                </Text>
              )}
              {rideWithPet && (
                <View style={styles.petInfo}>
                  <Ionicons name="paw" size={16} color={Colors.primary} />
                  <Text style={styles.petText}>Pet-friendly ride</Text>
                </View>
              )}
            </Card>
          )}

          <Card style={styles.statusCard} left={<Ionicons name="car" size={32} color={Colors.primary} />}>
            <Text style={styles.statusText}>{status}</Text>
            {rideWithPet && (
              <View style={styles.petStatus}>
                <Ionicons name="paw" size={16} color={Colors.primary} />
                <Text style={styles.petStatusText}>Matching with pet-friendly drivers</Text>
              </View>
            )}
          </Card>
          {driver && (
            <Card style={styles.driverCard} left={<Ionicons name="person-circle" size={32} color={Colors.primary} />}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverInfo}>{driver.car} • {driver.plate}</Text>
              <Text style={styles.driverInfo}>⭐ {driver.rating}</Text>
              {rideWithPet && (
                <View style={styles.petDriverInfo}>
                  <Ionicons name="paw" size={16} color={Colors.success} />
                  <Text style={styles.petDriverText}>Pet-friendly driver</Text>
                </View>
              )}
            </Card>
          )}
          <View style={styles.mapPlaceholder}>
            <Ionicons name="navigate" size={64} color={Colors.textSecondary} />
            <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Live map will appear here</Text>
          </View>
          <Button title="Share Trip" icon="share-social" style={styles.actionBtn} onPress={() => {}} />
          <Button 
            title="Chat with Driver" 
            icon="chatbubbles" 
            style={[styles.actionBtn, { backgroundColor: Colors.success || '#4CAF50' }]} 
            onPress={() => {
              if (driver) {
                navigation.navigate('Chat', { 
                  rideId, 
                  driverName: driver.name 
                });
              } else {
                Alert.alert('No Driver', 'Driver information not available yet.');
              }
            }} 
          />
          <Button 
            title="Cancel Ride" 
            icon="close" 
            style={[styles.actionBtn, { backgroundColor: Colors.error }]} 
            onPress={() => {
              Alert.alert(
                'Cancel Ride',
                'Are you sure you want to cancel this ride?',
                [
                  { text: 'No', style: 'cancel' },
                  { 
                    text: 'Yes', 
                    style: 'destructive',
                    onPress: () => {
                      socketService.cancelRide(rideId);
                      navigation.goBack();
                    }
                  }
                ]
              );
            }} 
          />
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
  statusCard: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statusText: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 18,
  },
  scheduledCard: {
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  scheduledTitle: {
    ...Typography.h4,
    color: Colors.warning,
    marginBottom: 4,
  },
  scheduledTime: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: 4,
  },
  scheduledLocation: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  scheduledDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  driverCard: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  driverName: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 4,
  },
  driverInfo: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  actionBtn: {
    marginTop: Spacing.sm,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  petText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  petStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  petStatusText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  petDriverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  petDriverText: {
    color: Colors.success,
    fontSize: 14,
    marginLeft: 4,
  },
}); 