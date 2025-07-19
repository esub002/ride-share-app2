import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../utils/api';
import socketService from '../utils/socket';

const rideTypes = [
  { type: 'Economy', icon: 'car-outline', price: '$8' },
  { type: 'Premium', icon: 'car-sport-outline', price: '$14' },
  { type: 'Pool', icon: 'people-outline', price: '$5' },
];

export default function RideRequestScreen({ navigation }) {
  const [destination, setDestination] = useState('');
  const [selected, setSelected] = useState('Economy');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to request a ride.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
    }
  };

  const handleRequestRide = async () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination.');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Request ride through API
      const rideData = {
        origin: `${currentLocation.latitude},${currentLocation.longitude}`,
        destination: destination.trim(),
        rideType: selected,
        pickupLocation: `${currentLocation.latitude},${currentLocation.longitude}`,
      };

      const response = await apiRequest('/api/rides', {
        method: 'POST',
        body: rideData,
        auth: true,
      });

      if (response && response.id) {
        // Emit socket event for real-time updates
        socketService.requestRide({
          rideId: response.id,
          ...rideData,
        });

        // Navigate to ride status screen
        navigation.replace('RideStatus', { 
          rideId: response.id,
          rideData: response,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert(
        'Request Failed', 
        error.message || 'Unable to request ride. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Request a Ride</Text>
      <View style={styles.inputBlockShadow}>
        <View style={styles.inputRowRedesigned}>
          <Ionicons name="location-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.inputRedesigned}
            placeholder="Enter destination"
            placeholderTextColor="#72809b"
            value={destination}
            onChangeText={setDestination}
          />
        </View>
      </View>
      <Text style={styles.label}>Select Ride Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rideTypes}>
        {rideTypes.map((rt) => (
          <Card
            key={rt.type}
            style={[styles.rideCard, selected === rt.type && styles.selectedCard]}
            left={<Ionicons name={rt.icon} size={28} color={Colors.primary} />}
            right={<Text style={styles.price}>{rt.price}</Text>}
            onPress={() => setSelected(rt.type)}
          >
            <Text style={styles.rideType}>{rt.type}</Text>
          </Card>
        ))}
      </ScrollView>
      <Button
        title={loading ? "Requesting Ride..." : "Confirm Ride"}
        icon="checkmark"
        style={styles.confirmBtn}
        disabled={!destination || loading || !currentLocation}
        onPress={handleRequestRide}
      />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} color={Colors.primary} />}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: Spacing.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  rideTypes: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  rideCard: {
    alignItems: 'center',
    width: 120,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  rideType: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: 6,
  },
  price: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmBtn: {
    marginTop: Spacing.lg,
  },
  inputBlockShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
    marginBottom: 18,
  },
  inputRowRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 0,
  },
  inputRedesigned: {
    flex: 1,
    fontSize: 16,
    color: '#aeb4cf',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    fontFamily: Typography.fontFamily,
  },
}); 