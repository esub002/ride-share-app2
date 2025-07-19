import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function HomeScreen({ navigation }) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [rideType, setRideType] = useState('standard');
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);

  const rideTypes = [
    { id: 'standard', name: 'Standard', icon: 'directions-car', basePrice: 15 },
    { id: 'premium', name: 'Premium', icon: 'directions-car', basePrice: 25 },
    { id: 'xl', name: 'XL', icon: 'airport-shuttle', basePrice: 20 },
    { id: 'bike', name: 'Bike', icon: 'motorcycle', basePrice: 10 }
  ];

  useEffect(() => {
    // Calculate estimated fare when locations change
    if (pickupLocation && dropoffLocation) {
      const basePrice = rideTypes.find(type => type.id === rideType)?.basePrice || 15;
      const distance = Math.random() * 10 + 2; // Mock distance calculation
      const fare = basePrice + (distance * 2);
      setEstimatedFare(fare.toFixed(2));
    }
  }, [pickupLocation, dropoffLocation, rideType]);

  const requestRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please enter pickup and dropoff locations');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/rides/request`, {
        riderId: 'rider_123', // Mock rider ID
        pickupLocation: {
          latitude: 41.9090653,
          longitude: -87.8528217,
          address: pickupLocation
        },
        dropoffLocation: {
          latitude: 41.9090653 + (Math.random() - 0.5) * 0.01,
          longitude: -87.8528217 + (Math.random() - 0.5) * 0.01,
          address: dropoffLocation
        },
        rideType,
        estimatedFare: parseFloat(estimatedFare),
        notes: ''
      });

      const newRideRequest = response.data.rideRequest;
      setRideRequest(newRideRequest);
      setShowRideModal(true);

      // Start polling for nearby drivers
      pollForNearbyDrivers(newRideRequest.id);

      Alert.alert(
        'Ride Requested!',
        'We\'re finding the best driver for you...',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollForNearbyDrivers = async (requestId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/rides/request/${requestId}/nearby-drivers`);
        setNearbyDrivers(response.data.nearbyDrivers);

        if (response.data.nearbyDrivers.length > 0) {
          // Simulate driver acceptance after 3-5 seconds
          setTimeout(() => {
            acceptRideByDriver(requestId, response.data.nearbyDrivers[0].driverId);
          }, Math.random() * 2000 + 3000);
        }
      } catch (error) {
        console.error('Error polling for drivers:', error);
      }
    }, 2000);

    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 30000);
  };

  const acceptRideByDriver = async (requestId, driverId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/rides/request/${requestId}/accept`, {
        driverId
      });

      setCurrentRide(response.data.ride);
      setShowRideModal(false);
      
      Alert.alert(
        'Driver Found!',
        `Your ride has been accepted. Driver is on the way!`,
        [
          {
            text: 'View Ride',
            onPress: () => navigation.navigate('RideStatus', { ride: response.data.ride })
          }
        ]
      );

    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const cancelRideRequest = async () => {
    if (!rideRequest) return;

    try {
      await axios.patch(`${API_BASE_URL}/rides/ride/${rideRequest.id}/status`, {
        status: 'cancelled',
        reason: 'Cancelled by rider'
      });

      setRideRequest(null);
      setShowRideModal(false);
      setNearbyDrivers([]);

      Alert.alert('Cancelled', 'Your ride request has been cancelled.');

    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
  };

  const RideRequestModal = () => (
    <Modal
      visible={showRideModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Finding Your Driver</Text>
          
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.searchingText}>Searching for nearby drivers...</Text>
          </View>

          {nearbyDrivers.length > 0 && (
            <View style={styles.driversContainer}>
              <Text style={styles.driversTitle}>Nearby Drivers Found:</Text>
              {nearbyDrivers.slice(0, 3).map((driver, index) => (
                <View key={index} style={styles.driverItem}>
                  <MaterialIcons name="person" size={24} color="#007AFF" />
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverText}>Driver {driver.driverId}</Text>
                    <Text style={styles.distanceText}>{driver.distance} km away</Text>
                  </View>
                  <Text style={styles.etaText}>{driver.estimatedArrival} min</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelRideRequest}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request a Ride</Text>
        <Text style={styles.headerSubtitle}>Where would you like to go?</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Pickup Location */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="my-location" size={24} color="#007AFF" />
          <TextInput
            style={styles.input}
            placeholder="Pickup location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
        </View>

        {/* Dropoff Location */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="location-on" size={24} color="#FF3B30" />
          <TextInput
            style={styles.input}
            placeholder="Where to?"
            value={dropoffLocation}
            onChangeText={setDropoffLocation}
          />
        </View>

        {/* Ride Type Selection */}
        <Text style={styles.sectionTitle}>Choose Ride Type</Text>
        <View style={styles.rideTypesContainer}>
          {rideTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.rideTypeButton,
                rideType === type.id && styles.rideTypeButtonActive
              ]}
              onPress={() => setRideType(type.id)}
            >
              <MaterialIcons
                name={type.icon}
                size={24}
                color={rideType === type.id ? '#FFFFFF' : '#007AFF'}
              />
              <Text style={[
                styles.rideTypeText,
                rideType === type.id && styles.rideTypeTextActive
              ]}>
                {type.name}
              </Text>
              <Text style={[
                styles.rideTypePrice,
                rideType === type.id && styles.rideTypePriceActive
              ]}>
                ${type.basePrice}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estimated Fare */}
        {estimatedFare > 0 && (
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Fare:</Text>
            <Text style={styles.fareAmount}>${estimatedFare}</Text>
          </View>
        )}

        {/* Request Ride Button */}
        <TouchableOpacity
          style={[styles.requestButton, loading && styles.requestButtonDisabled]}
          onPress={requestRide}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="directions-car" size={24} color="#FFFFFF" />
              <Text style={styles.requestButtonText}>Request Ride</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RideHistory')}
          >
            <MaterialIcons name="history" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Ride History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Favorites')}
          >
            <MaterialIcons name="favorite" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Schedule')}
          >
            <MaterialIcons name="schedule" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RideRequestModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  rideTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rideTypeButton: {
    width: '48%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  rideTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  rideTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 5,
  },
  rideTypeTextActive: {
    color: '#FFFFFF',
  },
  rideTypePrice: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  rideTypePriceActive: {
    color: '#FFFFFF',
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginBottom: 20,
  },
  fareLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  requestButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  quickActions: {
    padding: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#1A1A1A',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  searchingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  searchingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  driversContainer: {
    marginBottom: 20,
  },
  driversTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1A1A1A',
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  driverInfo: {
    flex: 1,
    marginLeft: 10,
  },
  driverText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  distanceText: {
    fontSize: 12,
    color: '#666666',
  },
  etaText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 