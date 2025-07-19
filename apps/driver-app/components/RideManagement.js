import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Button, Alert, FlatList, ActivityIndicator } from 'react-native';
import apiService from '../utils/api';
import { ErrorContext } from '../App';

export default function RideManagement() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setError } = useContext(ErrorContext);
  const [actionError, setActionError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Fetch available rides on mount
  useEffect(() => {
    fetchRides();
    // Listen for real-time ride requests
    if (apiService.socket) {
      apiService.socket.on('ride:request', handleNewRideRequest);
      apiService.socket.on('ride:statusUpdate', handleRideStatusUpdate);
    }
    return () => {
      if (apiService.socket) {
        apiService.socket.off('ride:request', handleNewRideRequest);
        apiService.socket.off('ride:statusUpdate', handleRideStatusUpdate);
      }
    };
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const availableRides = await apiService.getAvailableRides();
      setRides(availableRides || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRideRequest = (ride) => {
    setRides(prev => [ride, ...prev]);
  };

  const handleRideStatusUpdate = (update) => {
    setRides(prev => prev.map(ride => ride.id === update.rideId ? { ...ride, status: update.status } : ride));
  };

  const handleAcceptRide = async (rideId) => {
    setAcceptingId(rideId);
    try {
      await apiService.acceptRide(rideId, {}, "Could not accept ride. Please try again.");
      setActionError(null);
      Alert.alert('Success', 'Ride accepted');
      fetchRides();
    } catch (error) {
      setActionError("Could not accept ride. Please try again.");
      setError("Could not accept ride. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectRide = async (rideId) => {
    setRejectingId(rideId);
    try {
      await apiService.rejectRide(rideId, '', "Could not reject ride. Please try again.");
      setActionError(null);
      Alert.alert('Success', 'Ride rejected');
      fetchRides();
    } catch (error) {
      setActionError("Could not reject ride. Please try again.");
      setError("Could not reject ride. Please try again.");
    } finally {
      setRejectingId(null);
    }
  };

  const completeRide = async (rideId) => {
    try {
      await apiService.completeRide(rideId);
      Alert.alert('Success', 'Ride completed');
      fetchRides();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete ride');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Ride Management</Text>
      {loading ? <Text>Loading...</Text> : (
        <FlatList
          data={rides}
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
              <Text>Pickup: {item.pickup}</Text>
              <Text>Destination: {item.destination}</Text>
              <Text>Status: {item.status}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Button
                  title={acceptingId === item.id ? "Accepting..." : "Accept"}
                  onPress={() => handleAcceptRide(item.id)}
                  disabled={acceptingId === item.id}
                />
                <View style={{ width: 8 }} />
                <Button
                  title={rejectingId === item.id ? "Rejecting..." : "Reject"}
                  onPress={() => handleRejectRide(item.id)}
                  disabled={rejectingId === item.id}
                />
                <View style={{ width: 8 }} />
                <Button title="Complete" onPress={() => completeRide(item.id)} />
              </View>
              {actionError && <Text style={{ color: 'red', margin: 8 }}>{actionError}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}
