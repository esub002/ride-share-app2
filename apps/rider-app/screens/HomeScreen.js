import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapLocationPicker from './MapLocationPicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const API_BASE_URL = 'http://localhost:3000/api';

export default function HomeScreen({ navigation }) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [rideType, setRideType] = useState('standard');
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [showPickupMapPicker, setShowPickupMapPicker] = useState(false);
  const [showDropoffMapPicker, setShowDropoffMapPicker] = useState(false);

  const rideTypes = [
    { id: 'standard', name: 'Standard', icon: 'directions-car', basePrice: 15 },
    { id: 'premium', name: 'Premium', icon: 'directions-car', basePrice: 25 },
    { id: 'xl', name: 'XL', icon: 'airport-shuttle', basePrice: 20 },
    { id: 'bike', name: 'Bike', icon: 'motorcycle', basePrice: 10 }
  ];

  const mapRef = useRef(null);
  // Set the Google Maps API key directly
  const GOOGLE_MAPS_API_KEY = 'AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg';

  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      setLocationError('');
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          setLocationLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setPickupCoords(coords);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        // Optionally reverse geocode to address
        let address = '';
        try {
          const geocode = await Location.reverseGeocodeAsync(coords);
          if (geocode && geocode.length > 0) {
            address = `${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}`;
          }
        } catch {}
        setPickupLocation(address);
      } catch (e) {
        setLocationError('Failed to fetch location');
      }
      setLocationLoading(false);
    })();
  }, []);

  // Helper to fetch route polyline from Google Directions API
  async function fetchRoutePolyline(origin, destination) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const points = decodePolyline(data.routes[0].overview_polyline.points);
      // Extract ETA and distance
      const leg = data.routes[0].legs[0];
      setEta(leg.duration.text);
      setDistance(leg.distance.text);
      return points;
    }
    setEta('');
    setDistance('');
    return [];
  }
  // Polyline decoder (Google encoded polyline algorithm)
  function decodePolyline(encoded) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  // Helper to capitalize and format place type
  function formatPlaceType(type) {
    if (!type) return '';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Helper to check if input is coordinates
  function isCoordinateInput(input) {
    return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(input);
  }

  // Google Places Autocomplete with location bias, nearby search, and coordinate support
  async function fetchPlaceSuggestions(input, setSuggestions, userCoords, showNearby = false, withType = false) {
    let coordSuggestion = null;
    if (isCoordinateInput(input)) {
      // Parse coordinates
      const [lat, lng] = input.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geocode && geocode.length > 0) {
            const address = `${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}`;
            coordSuggestion = {
              description: address,
              isNearby: false,
              type: '',
              coords: { latitude: lat, longitude: lng },
              isCoordinate: true,
              rawInput: input
            };
          }
        } catch {}
      }
    }
    // Fetch autocomplete suggestions
    if (input && input.length >= 3) {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;
      if (userCoords) {
        url += `&location=${userCoords.latitude},${userCoords.longitude}&radius=2000`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.predictions) {
        if (withType) {
          const detailsPromises = data.predictions.slice(0, 5).map(async (p) => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=types&key=${GOOGLE_MAPS_API_KEY}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();
            let type = '';
            if (detailsData.result && detailsData.result.types && detailsData.result.types.length > 0) {
              type = detailsData.result.types[0];
            }
            return {
              description: p.description,
              isNearby: false,
              type: type
            };
          });
          autocompleteSuggestions = await Promise.all(detailsPromises);
        } else {
          autocompleteSuggestions = data.predictions.map(p => ({ description: p.description, isNearby: false, type: '' }));
        }
      }
    }
    // Fetch nearby suggestions
    if (showNearby && userCoords) {
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userCoords.latitude},${userCoords.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`;
      const nearbyRes = await fetch(nearbyUrl);
      const nearbyData = await nearbyRes.json();
      if (nearbyData.results) {
        nearbySuggestions = nearbyData.results.map(p => ({ description: p.name + (p.vicinity ? (', ' + p.vicinity) : ''), isNearby: true, type: p.types && p.types.length > 0 ? p.types[0] : '' }));
      }
    }
    // Merge: autocomplete first, then nearby (deduplicate)
    let all = [
      ...(coordSuggestion ? [coordSuggestion] : []),
      ...autocompleteSuggestions,
    ];
    // Only add divider if there are autocomplete suggestions and nearby suggestions
    if (autocompleteSuggestions.length > 0 && nearbySuggestions.length > 0) {
      all.push({ isDivider: true });
    }
    // Add nearby suggestions, deduplicated
    all = [
      ...all,
      ...nearbySuggestions.filter(
        n => !autocompleteSuggestions.some(a => a.description === n.description)
      ),
    ];
    // If input is empty, only show nearby (no divider)
    if (!input || input.length < 3) {
      all = [
        ...(coordSuggestion ? [coordSuggestion] : []),
        ...nearbySuggestions
      ];
    }
    setSuggestions(all);
  }

  // Geocode dropoff location when entered
  useEffect(() => {
    const fetchDropoffCoords = async () => {
      if (!dropoffLocation) {
        setDropoffCoords(null);
        setRouteCoords([]);
        return;
      }
      try {
        const geocode = await Location.geocodeAsync(dropoffLocation);
        if (geocode && geocode.length > 0) {
          const coords = {
            latitude: geocode[0].latitude,
            longitude: geocode[0].longitude,
          };
          setDropoffCoords(coords);
          // Fetch real route polyline if pickupCoords exists
          if (pickupCoords) {
            const polyline = await fetchRoutePolyline(pickupCoords, coords);
            setRouteCoords(polyline.length > 0 ? polyline : [pickupCoords, coords]);
          }
        } else {
          setDropoffCoords(null);
          setRouteCoords([]);
        }
      } catch {
        setDropoffCoords(null);
        setRouteCoords([]);
      }
    };
    fetchDropoffCoords();
  }, [dropoffLocation, pickupCoords]);

  // Pickup autocomplete
  useEffect(() => {
    if (showPickupSuggestions) {
      fetchPlaceSuggestions(pickupLocation, setPickupSuggestions, pickupCoords, true);
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupLocation, showPickupSuggestions, pickupCoords]);
  // Dropoff autocomplete
  useEffect(() => {
    if (showDropoffSuggestions) {
      fetchPlaceSuggestions(dropoffLocation, setDropoffSuggestions, pickupCoords, true, true);
    } else {
      setDropoffSuggestions([]);
    }
  }, [dropoffLocation, showDropoffSuggestions, pickupCoords]);

  // Animate map to fit both markers
  useEffect(() => {
    if (pickupCoords && dropoffCoords && mapRef.current) {
      setTimeout(() => {
        mapRef.current.fitToCoordinates([pickupCoords, dropoffCoords], {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      }, 500);
    }
  }, [pickupCoords, dropoffCoords]);

  // Handler for 'Use My Location' button
  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setPickupCoords(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      // Optionally reverse geocode to address
      let address = '';
      try {
        const geocode = await Location.reverseGeocodeAsync(coords);
        if (geocode && geocode.length > 0) {
          address = `${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}`;
        }
      } catch {}
      setPickupLocation(address);
    } catch (e) {
      setLocationError('Failed to fetch location');
    }
    setLocationLoading(false);
  };

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

  function splitAddressParts(description) {
    const parts = description.split(',');
    if (parts.length > 1) {
      return {
        main: parts.slice(0, -1).join(',').trim(),
        cityState: parts[parts.length - 1].trim(),
      };
    }
    return { main: description, cityState: '' };
  }

  // Update highlightMatch to return [pre, match, post] for inline rendering
  function highlightMatchParts(text, query) {
    if (!query) return [text, '', ''];
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return [text, '', ''];
    return [
      text.slice(0, idx),
      text.slice(idx, idx + query.length),
      text.slice(idx + query.length)
    ];
  }

  // Helper to get icon for POI type
  function getPoiIcon(type) {
    const POI_TYPE_ICONS = {
      restaurant: 'restaurant',
      cafe: 'local-cafe',
      bar: 'local-bar',
      park: 'park',
      airport: 'local-airport',
      shopping_mall: 'local-mall',
      store: 'store',
      hospital: 'local-hospital',
      school: 'school',
      bank: 'account-balance',
      lodging: 'hotel',
      gym: 'fitness-center',
      pharmacy: 'local-pharmacy',
      gas_station: 'local-gas-station',
      subway_station: 'subway',
      train_station: 'train',
      bus_station: 'directions-bus',
      default: 'place',
    };
    if (!type) return POI_TYPE_ICONS.default;
    return POI_TYPE_ICONS[type] || POI_TYPE_ICONS.default;
  }

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const [pickupInputLayout, setPickupInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dropoffInputLayout, setDropoffInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Request a Ride</Text>
          <Text style={styles.headerSubtitle}>Where would you like to go?</Text>
        </View>
        {/* Map Section */}
        <View style={{ height: 250, margin: 15, borderRadius: 12, overflow: 'hidden' }}>
          {locationLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
          ) : locationError ? (
            <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{locationError}</Text>
          ) : mapRegion ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              region={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {pickupCoords && (
                <Marker coordinate={pickupCoords} title="Pickup" pinColor="#007AFF" />
              )}
              {dropoffCoords && (
                <Marker coordinate={dropoffCoords} title="Dropoff" pinColor="#FF3B30" />
              )}
              {routeCoords.length > 1 && (
                <Polyline coordinates={routeCoords} strokeColor="#007AFF" strokeWidth={4} />
              )}
            </MapView>
          ) : null}
          {/* Use My Location Button */}
          <TouchableOpacity
            style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: '#fff', borderRadius: 24, padding: 12, elevation: 3 }}
            onPress={handleUseMyLocation}
          >
            <MaterialIcons name="my-location" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        {/* ETA and Distance */}
        {eta && distance && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="timer" size={20} color="#007AFF" />
            <Text style={{ marginLeft: 6, marginRight: 16, fontWeight: '600', color: '#007AFF' }}>ETA: {eta}</Text>
            <MaterialIcons name="map" size={20} color="#007AFF" />
            <Text style={{ marginLeft: 6, fontWeight: '600', color: '#007AFF' }}>Distance: {distance}</Text>
          </View>
        )}
        <View style={styles.formContainer}>
          {/* Pickup Location */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="my-location" size={24} color="#007AFF" />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                ref={pickupInputRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Pickup location"
                value={pickupLocation}
                onChangeText={text => {
                  setPickupLocation(text);
                  setShowPickupSuggestions(true);
                }}
                onFocus={() => setShowPickupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                onLayout={e => setPickupInputLayout(e.nativeEvent.layout)}
              />
              <TouchableOpacity onPress={() => setShowPickupMapPicker(true)} style={{ marginLeft: 8 }}>
                <MaterialIcons name="map" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Dropoff Location */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-on" size={24} color="#FF3B30" />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                ref={dropoffInputRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Where to?"
                value={dropoffLocation}
                onChangeText={text => {
                  setDropoffLocation(text);
                  setShowDropoffSuggestions(true);
                }}
                onFocus={() => setShowDropoffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
                onLayout={e => setDropoffInputLayout(e.nativeEvent.layout)}
              />
              <TouchableOpacity onPress={() => setShowDropoffMapPicker(true)} style={{ marginLeft: 8 }}>
                <MaterialIcons name="map" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
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
      </KeyboardAwareScrollView>
      {/* Pickup Suggestions Dropdown (absolute overlay) */}
      {showPickupSuggestions && pickupSuggestions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: pickupInputLayout.x + 16, // adjust for container padding
            top: pickupInputLayout.y + pickupInputLayout.height + 16, // adjust for container padding
            width: pickupInputLayout.width,
            zIndex: 100,
          }}
        >
          <FlatList
            data={pickupSuggestions}
            keyExtractor={(item, idx) => item.isDivider ? 'divider' + idx : (item.description + (item.isCoordinate ? item.rawInput : ''))}
            style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: 220, borderWidth: 1, borderColor: '#eee', elevation: 6 }}
            renderItem={({ item, index }) => {
              if (item.isDivider) {
                return (
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f6f6f6' }}>
                    <Text style={{ color: '#888', fontSize: 13 }}>Nearby places</Text>
                  </View>
                );
              }
              const { main, cityState } = splitAddressParts(item.description);
              const [pre, match, post] = highlightMatchParts(main, pickupLocation);
              return (
                <>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 }}
                    onPress={async () => {
                      if (item.isCoordinate && item.coords) {
                        setPickupLocation(item.description);
                        setPickupCoords(item.coords);
                        setMapRegion({ ...item.coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                        setShowPickupSuggestions(false);
                        return;
                      }
                      setPickupLocation(item.description);
                      setShowPickupSuggestions(false);
                      // Geocode selected address
                      const geocode = await Location.geocodeAsync(item.description);
                      if (geocode && geocode.length > 0) {
                        setPickupCoords({ latitude: geocode[0].latitude, longitude: geocode[0].longitude });
                        setMapRegion({ latitude: geocode[0].latitude, longitude: geocode[0].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                      }
                    }}
                  >
                    <MaterialIcons
                      name={getPoiIcon(item.type)}
                      size={24}
                      color={item.isNearby ? '#2196F3' : '#007AFF'}
                      style={{ marginRight: 14 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {pre}
                        <Text style={{ fontWeight: 'bold' }}>{match}</Text>
                        {post}
                        {!!cityState && <Text style={{ color: '#888', fontWeight: 'normal', fontSize: 14 }}> {cityState}</Text>}
                      </Text>
                    </View>
                    {item.isCoordinate && <Text style={{ color: '#007AFF', marginLeft: 8, fontSize: 12 }}>(Coordinates)</Text>}
                    {item.isNearby && <Text style={{ color: '#2196F3', marginLeft: 8, fontSize: 12 }}>(Nearby)</Text>}
                  </TouchableOpacity>
                  {index < pickupSuggestions.length - 1 && !pickupSuggestions[index + 1]?.isDivider && (
                    <View style={{ height: 1, backgroundColor: '#eee', marginLeft: 52 }} />
                  )}
                </>
              );
            }}
          />
        </View>
      )}
      {/* Dropoff Suggestions Dropdown (absolute overlay) */}
      {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: dropoffInputLayout.x + 16,
            top: dropoffInputLayout.y + dropoffInputLayout.height + 16,
            width: dropoffInputLayout.width,
            zIndex: 100,
          }}
        >
          <FlatList
            data={dropoffSuggestions}
            keyExtractor={(item, idx) => item.isDivider ? 'divider' + idx : (item.description + (item.isCoordinate ? item.rawInput : ''))}
            style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: 220, borderWidth: 1, borderColor: '#eee', elevation: 6 }}
            renderItem={({ item, index }) => {
              if (item.isDivider) {
                return (
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f6f6f6' }}>
                    <Text style={{ color: '#888', fontSize: 13 }}>Nearby places</Text>
                  </View>
                );
              }
              const { main, cityState } = splitAddressParts(item.description);
              const [pre, match, post] = highlightMatchParts(main, dropoffLocation);
              return (
                <>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 }}
                    onPress={async () => {
                      if (item.isCoordinate && item.coords) {
                        setDropoffLocation(item.description);
                        setDropoffCoords(item.coords);
                        setShowDropoffSuggestions(false);
                        return;
                      }
                      setDropoffLocation(item.description);
                      setShowDropoffSuggestions(false);
                      // Geocode selected address
                      const geocode = await Location.geocodeAsync(item.description);
                      if (geocode && geocode.length > 0) {
                        setDropoffCoords({ latitude: geocode[0].latitude, longitude: geocode[0].longitude });
                      }
                    }}
                  >
                    <MaterialIcons
                      name={getPoiIcon(item.type)}
                      size={24}
                      color={item.isNearby ? '#2196F3' : '#007AFF'}
                      style={{ marginRight: 14 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {pre}
                        <Text style={{ fontWeight: 'bold' }}>{match}</Text>
                        {post}
                        {!!cityState && <Text style={{ color: '#888', fontWeight: 'normal', fontSize: 14 }}> {cityState}</Text>}
                      </Text>
                    </View>
                    {item.isCoordinate && <Text style={{ color: '#007AFF', marginLeft: 8, fontSize: 12 }}>(Coordinates)</Text>}
                    {item.isNearby && <Text style={{ color: '#2196F3', marginLeft: 8, fontSize: 12 }}>(Nearby)</Text>}
                  </TouchableOpacity>
                  {index < dropoffSuggestions.length - 1 && !dropoffSuggestions[index + 1]?.isDivider && (
                    <View style={{ height: 1, backgroundColor: '#eee', marginLeft: 52 }} />
                  )}
                </>
              );
            }}
          />
        </View>
      )}
    </View>
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