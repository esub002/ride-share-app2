import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, PermissionsAndroid, StatusBar, Keyboard, Alert, FlatList, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../utils/api';
import socketService from '../utils/socket';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';
import TrustedContactBanner from '../components/TrustedContactBanner';

const GOOGLE_API_KEY = 'AIzaSyCH1wwmHxobGXvXgpG8qSiuPxnw5HwndcI';

const rideOptions = [
  { type: 'Economy', icon: 'car-outline', eta: '2 min', price: '$8' },
  { type: 'Premium', icon: 'car-sport-outline', eta: '4 min', price: '$14' },
  { type: 'Pool', icon: 'people-outline', eta: '3 min', price: '$5' },
];
const quickChips = [
  { label: 'Home', icon: 'home-outline', address: '123 Home Street' },
  { label: 'Work', icon: 'briefcase-outline', address: '456 Work Ave' },
  { label: 'Airport', icon: 'airplane-outline', address: 'International Airport' },
  { label: 'Add', icon: 'add-circle-outline', address: '' },
];

const paymentMethods = [
  { type: 'Card', icon: 'card-outline' },
  { type: 'UPI', icon: 'logo-google' },
  { type: 'Wallet', icon: 'wallet-outline' },
  { type: 'Cash', icon: 'cash-outline' },
];

// 1. Add animated scale for button presses
function AnimatedTouchable({ children, style, onPress, ...props }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['40%', '60%'], []);
  const toInputRef = useRef();
  const fromInputRef = useRef();
  const navigation = useNavigation();
  const [sosVisible, setSosVisible] = useState(false);
  const paymentSheetRef = useRef(null);
  const paymentSnapPoints = useMemo(() => ['45%', '60%'], []);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const { token, trustedContacts, trustedContactPromptDismissed } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Add state for recent rides and ride type selection visibility
  const [recentRides, setRecentRides] = useState([]);
  const [showRideType, setShowRideType] = useState(false);

  // 1. Remove Modal and Choose Ride button logic
  // 2. Add a ref for rideTypeSheetRef
  const rideTypeSheetRef = useRef(null);

  // 3. useEffect to navigate to schedule screen when from/to are filled
  useEffect(() => {
    if (from && to) {
      // Navigate to schedule screen instead of opening ride type sheet
      navigation.navigate('ScheduleRide', { from, to });
      // Clear the inputs after navigation
      setFrom('');
      setTo('');
    }
  }, [from, to]);

  // 4. Remove Modal and inline ride type selection, and add this after recent rides:
  // 4. Show ride type selection only if showRideType is true and both from/to are filled
  // useEffect(() => {
  //   if (from && to) setShowRideType(true);
  //   else setShowRideType(false);
  // }, [from, to]);

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (input, setSuggestions) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&types=geocode`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Debounced version of fetchSuggestions
  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 300),
    []
  );

  // Handle from input changes
  const handleFromChange = (text) => {
    setFrom(text);
    setShowFromSuggestions(true);
    debouncedFetchSuggestions(text, setFromSuggestions);
  };

  // Handle to input changes
  const handleToChange = (text) => {
    setTo(text);
    setShowToSuggestions(true);
    debouncedFetchSuggestions(text, setToSuggestions);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion, isFrom) => {
    console.log('Suggestion selected:', suggestion.description, 'isFrom:', isFrom);
    if (isFrom) {
      setFrom(suggestion.description);
      setShowFromSuggestions(false);
      setFromSuggestions([]);
      // Focus to input after selection
      setTimeout(() => {
        toInputRef.current && toInputRef.current.focus();
      }, 100);
    } else {
      setTo(suggestion.description);
      setShowToSuggestions(false);
      setToSuggestions([]);
      // Open bottom sheet after selection
      setTimeout(() => {
        if (from && suggestion.description && bottomSheetRef.current) {
          Keyboard.dismiss();
          bottomSheetRef.current.expand();
        }
      }, 100);
    }
  };

  // Render suggestion item
  const renderSuggestion = ({ item, isFrom }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        console.log('TouchableOpacity pressed for:', item.description);
        handleSuggestionSelect(item, isFrom);
      }}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons 
        name={isFrom ? "location-outline" : "flag-outline"} 
        size={16} 
        color={Colors.textSecondary} 
      />
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationLoaded(true);
          return;
        }
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setLocationLoaded(true);
      } catch (e) {
        setLocationLoaded(true);
      }
    })();
  }, []);

  // 2. Fetch recent rides on mount
  useEffect(() => {
    async function fetchRecentRides() {
      try {
        const rides = await apiRequest('/api/rides', { method: 'GET', auth: true });
        setRecentRides(rides);
      } catch (err) {
        setRecentRides([]);
      }
    }
    fetchRecentRides();
  }, []);

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
  };

  const handleConfirm = () => {
    // Instead of booking ride directly, open payment sheet
    setShowPaymentSheet(true);
    setTimeout(() => {
      paymentSheetRef.current && paymentSheetRef.current.expand();
    }, 100);
  };

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const rides = await apiRequest('/api/rides', { method: 'GET', auth: true });
      setRides(rides);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/rides', {
        method: 'POST',
        body: { from, to, paymentMethod },
        auth: true,
      });
      // handle success, e.g., navigate to RideStatusScreen
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChipPress = (chip) => {
    if (!from) {
      Alert.alert('Enter Pickup Location', 'Please enter your pickup location first.');
      fromInputRef && fromInputRef.current && fromInputRef.current.focus();
      return;
    }
    if (chip.address) {
      setTo(chip.address);
      setTimeout(() => {
        if (from && chip.address && bottomSheetRef.current) {
          Keyboard.dismiss();
          bottomSheetRef.current.expand();
        }
      }, 100);
    }
    // For 'Add', you could implement a custom address picker in the future
  };

  const handleTestNotifications = () => {
    navigation.navigate('NotificationTest');
  };

  const handleEmergency = async () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to trigger an emergency alert? This will notify emergency services and your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'SOS', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get current location
              const location = await Location.getCurrentPositionAsync({});
              
              // Send emergency alert to backend
              await apiRequest('/api/safety/emergency', {
                method: 'POST',
                body: {
                  type: 'sos',
                  location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  },
                  message: 'Emergency SOS triggered by user',
                },
                auth: true,
              });

              // Emit socket event for real-time notification
              socketService.triggerEmergency(null, {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              Alert.alert(
                'Emergency Alert Sent',
                'Emergency services have been notified. Help is on the way.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error sending emergency alert:', error);
              Alert.alert(
                'Error',
                'Failed to send emergency alert. Please try again or call emergency services directly.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  // 3. Handler for tapping a recent ride
  const handleRecentRidePress = (ride) => {
    setFrom(ride.origin);
    setTo(ride.destination);
    setShowRideType(true);
    setSelectedRide(null);
  };

  // 4. Show ride type selection only if showRideType is true and both from/to are filled
  // useEffect(() => {
  //   if (from && to) setShowRideType(true);
  //   else setShowRideType(false);
  // }, [from, to]);

  const gradientAnim = useRef(new Animated.Value(0)).current;
  const gradientColorsSets = [
    ['#6dd5ed', '#2193b0', '#f7971e'],
    ['#f7971e', '#f857a6', '#6dd5ed'],
    ['#43cea2', '#185a9d', '#f7971e'],
  ];
  const [gradientIndex, setGradientIndex] = useState(0);
  useEffect(() => {
    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
    const interval = setInterval(() => {
      setGradientIndex((i) => (i + 1) % gradientColorsSets.length);
      gradientAnim.setValue(0);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const interpolatedColors = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [gradientColorsSets[gradientIndex], gradientColorsSets[(gradientIndex + 1) % gradientColorsSets.length]],
  });

  // 2. Map pin bounce animation
  const pinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pinAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [region]);

  // Update input styles for accessibility and contrast
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  return (
    <LinearGradient
      colors={[Colors.gradientTop, Colors.primary, Colors.gradientBottom, Colors.accent]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Radial/Elliptical Glow Layer */}
      <LinearGradient
        colors={['rgba(58,116,229,0.25)', 'rgba(12,16,55,0.0)']}
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          right: '10%',
          height: 400,
          borderRadius: 200,
          zIndex: 0,
          transform: [{ scaleX: 1.5 }],
        }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={[styles.container, { backgroundColor: 'transparent', zIndex: 1 }]}> 
        {/* Trusted Contact Banner */}
        {trustedContacts.length === 0 && !trustedContactPromptDismissed && (
          <TrustedContactBanner onAdd={() => navigation.navigate('OnboardingTrustedContact')} />
        )}
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, Mohit 👋</Text>
            <Text style={styles.subtitle}>Where are you going?</Text>
          </View>
          <TouchableOpacity style={styles.wallet}>
            <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            <Text style={styles.walletText}>$45.75</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profile} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="menu" size={36} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={handleTestNotifications}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 1. Wrap location input fields in a card */}
        <View style={styles.inputBlockShadow}>
          <View style={styles.inputBlockCard}>
            {/* From Input */}
            <View style={styles.inputRowRedesigned}>
              <Ionicons name="location-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
              <TextInput
                ref={fromInputRef}
                style={[styles.inputRedesigned, fromFocused && styles.inputFocusedRedesigned]}
                placeholder="From (Pickup Location)"
                placeholderTextColor="#72809b"
                value={from}
                onChangeText={handleFromChange}
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => { setShowFromSuggestions(true); setFromFocused(true); }}
                onBlur={() => { setShowFromSuggestions(false); setFromFocused(false); }}
                onSubmitEditing={() => {
                  toInputRef.current && toInputRef.current.focus();
                }}
              />
            </View>
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={fromSuggestions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => renderSuggestion({ item, isFrom: true })}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
            {/* To Input */}
            <View style={styles.inputRowRedesigned}>
              <Ionicons name="flag-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
              <TextInput
                ref={toInputRef}
                style={[styles.inputRedesigned, toFocused && styles.inputFocusedRedesigned]}
                placeholder="To (Destination)"
                placeholderTextColor="#72809b"
                value={to}
                onChangeText={handleToChange}
                returnKeyType="done"
                onFocus={() => { setShowToSuggestions(true); setToFocused(true); }}
                onBlur={() => { setShowToSuggestions(false); setToFocused(false); }}
                onSubmitEditing={() => {
                  if (from && to && bottomSheetRef.current) {
                    Keyboard.dismiss();
                    bottomSheetRef.current.expand();
                  }
                }}
              />
            </View>
            {showToSuggestions && toSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={toSuggestions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => renderSuggestion({ item, isFrom: false })}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
          </View>
        </View>

        {/* 2. Restore map section to original, no card wrapper */}
        <Animated.View style={{
          borderRadius: 22,
          padding: 3,
          marginBottom: 18,
          backgroundColor: 'transparent',
        }}>
          <LinearGradient
            colors={gradientColorsSets[gradientIndex]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 2 }}
          >
            <View style={{ height: 275, borderRadius: 18, overflow: 'visible', position: 'relative', backgroundColor: '#fff' }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1, borderRadius: 18 }}
                region={region}
                showsUserLocation
                showsMyLocationButton
              >
                <Marker coordinate={region} title="You are here">
                  <Animated.View style={{ transform: [{ scale: pinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }) }] }}>
                    <Ionicons name="location" size={38} color={Colors.primary} />
                  </Animated.View>
                </Marker>
              </MapView>
              {/* SOS (emergency) button at bottom left */}
              <AnimatedTouchable
                style={[styles.sosButton, { position: 'absolute', left: 16, bottom: 16, zIndex: 10 }]}
                onPress={() => setSosVisible(true)}
              >
                <Ionicons name="alert" size={32} color="#fff" />
              </AnimatedTouchable>
              {/* Chatbot button at bottom right */}
              <AnimatedTouchable
                style={[styles.chatbotButton, { position: 'absolute', right: 16, bottom: 16, zIndex: 10 }]}
                onPress={() => navigation.navigate('Chatbot')}
              >
                <Ionicons name="chatbubbles" size={28} color="#fff" />
              </AnimatedTouchable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 3. Wrap recent rides in a card */}
        {recentRides.length > 0 && (
          <View style={[styles.card, { marginBottom: 12 }]}> 
            <Text style={[styles.sheetTitle, { marginBottom: 4 }]}>Recent Rides</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {recentRides.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={[styles.rideCard, { marginRight: 8, minWidth: 120 }]}
                  onPress={() => handleRecentRidePress(ride)}
                >
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                  <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{ride.origin} → {ride.destination}</Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 2 }}>{new Date(ride.created_at).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Ride Type Selection (only show if showRideType is true and both from/to are filled) */}
        <BottomSheet
          ref={rideTypeSheetRef}
          index={-1}
          snapPoints={["50%", "65%"]}
          enablePanDownToClose
          onClose={() => setSelectedRide(null)}
        >
          <View style={styles.rideTypeSheetContent}>
            {/* Modern Card-style Ride Type Summary */}
            <View style={styles.rideTypeSummaryCard}>
              <Ionicons name="car-outline" size={36} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 8 }} />
              <Text style={styles.rideTypeSummaryTitle}>Choose Your Ride</Text>
              <View style={styles.rideTypeSummaryRow}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <Text style={styles.rideTypeSummaryText}>From: <Text style={{ fontWeight: 'bold' }}>{from || '-'}</Text></Text>
              </View>
              <View style={styles.rideTypeSummaryRow}>
                <Ionicons name="flag-outline" size={18} color={Colors.primary} />
                <Text style={styles.rideTypeSummaryText}>To: <Text style={{ fontWeight: 'bold' }}>{to || '-'}</Text></Text>
              </View>
            </View>
            {/* Divider */}
            <View style={styles.rideTypeDivider} />
            {/* Ride Type Selection */}
            <Text style={styles.rideTypeOptionsTitle}>Select Ride Type</Text>
            <View style={styles.rideTypeOptionsRow}>
              {rideOptions.map((opt) => (
                <AnimatedTouchable
                  key={opt.type}
                  style={[styles.rideTypeCard, selectedRide?.type === opt.type && styles.selectedRideTypeCard]}
                  onPress={() => handleRideSelect(opt)}
                >
                  <Ionicons name={opt.icon} size={32} color={selectedRide?.type === opt.type ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.rideTypeOptionText, selectedRide?.type === opt.type && { color: Colors.primary }]}>{opt.type}</Text>
                  <Text style={styles.rideTypeEta}>{opt.eta}</Text>
                  <Text style={styles.rideTypePrice}>{opt.price}</Text>
                </AnimatedTouchable>
              ))}
            </View>
            {/* Confirm/Cancel Button Row */}
            <View style={styles.rideTypeButtonRow}>
              <Button
                title="Cancel"
                icon="close"
                style={[styles.confirmBtn, { backgroundColor: '#eee', flex: 1, marginRight: 8 }]}
                textStyle={{ color: Colors.textSecondary }}
                onPress={() => {
                  rideTypeSheetRef.current && rideTypeSheetRef.current.close();
                  setSelectedRide(null);
                }}
              />
              <Button
                title="Confirm Ride"
                icon="checkmark"
                style={[styles.confirmBtn, { flex: 1 }]}
                disabled={!selectedRide}
                onPress={() => {
                  if (!from || !to) {
                    Alert.alert('Enter Locations', 'Please enter both pickup and destination locations before confirming your ride.');
                    return;
                  }
                  handleConfirm();
                }}
              />
            </View>
          </View>
        </BottomSheet>

        {/* Payment Bottom Sheet */}
        <BottomSheet
          ref={paymentSheetRef}
          index={-1}
          snapPoints={paymentSnapPoints}
          enablePanDownToClose
          onClose={() => setShowPaymentSheet(false)}
        >
          <View style={styles.paymentSheetContent}>
            {/* Modern Card-style Ride Summary */}
            <View style={styles.paymentSummaryCard}>
              <Ionicons name="card-outline" size={36} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 8 }} />
              <Text style={styles.paymentSummaryTitle}>Ride Payment</Text>
              <View style={styles.paymentSummaryRow}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <Text style={styles.paymentSummaryText}>From: <Text style={{ fontWeight: 'bold' }}>{from || '-'}</Text></Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Ionicons name="flag-outline" size={18} color={Colors.primary} />
                <Text style={styles.paymentSummaryText}>To: <Text style={{ fontWeight: 'bold' }}>{to || '-'}</Text></Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Ionicons name="car-outline" size={18} color={Colors.primary} />
                <Text style={styles.paymentSummaryText}>Type: <Text style={{ fontWeight: 'bold' }}>{selectedRide?.type || '-'}</Text></Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
                <Text style={styles.paymentSummaryText}>Price: <Text style={{ fontWeight: 'bold', color: Colors.primary }}>{selectedRide?.price || '-'}</Text></Text>
              </View>
            </View>
            {/* Divider */}
            <View style={styles.paymentDivider} />
            {/* Payment Method Selection */}
            <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
            <View style={styles.paymentMethodsRow}>
              {paymentMethods.map((pm) => (
                <TouchableOpacity
                  key={pm.type}
                  style={[styles.paymentMethodCard, selectedPayment?.type === pm.type && styles.selectedPaymentMethod]}
                  onPress={() => setSelectedPayment(pm)}
                >
                  <Ionicons name={pm.icon} size={28} color={selectedPayment?.type === pm.type ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.paymentMethodText, selectedPayment?.type === pm.type && { color: Colors.primary }]}>{pm.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Pay Button Row */}
            <View style={styles.paymentButtonRow}>
              <Button
                title="Cancel"
                icon="close"
                style={[styles.confirmBtn, { backgroundColor: '#eee', flex: 1, marginRight: 8 }]}
                textStyle={{ color: Colors.textSecondary }}
                onPress={() => {
                  setShowPaymentSheet(false);
                  setSelectedRide(null);
                  setSelectedPayment(paymentMethods[0]);
                  paymentSheetRef.current && paymentSheetRef.current.close();
                }}
              />
              <Button
                title={`Pay & Book Ride (${selectedRide?.price || '-'})`}
                icon="checkmark"
                style={[styles.confirmBtn, { flex: 1 }]}
                disabled={!selectedPayment || !selectedRide}
                onPress={handlePayAndBook}
              />
            </View>
          </View>
        </BottomSheet>

        {/* SOS Modal */}
        <Modal
          visible={sosVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setSosVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.sosModal}>
              <Ionicons name="alert" size={48} color={Colors.error || '#FF3B30'} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.sosTitle}>Emergency</Text>
              <Text style={styles.sosDesc}>Choose an action:</Text>
              <TouchableOpacity
                style={styles.sosAction}
                onPress={() => { setSosVisible(false); Alert.alert('Share Ride Details', 'Ride details shared with your emergency contact.'); }}
              >
                <Ionicons name="share-social" size={22} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sosActionText}>Share Ride Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sosAction}
                onPress={() => { setSosVisible(false); Alert.alert('Calling 112', 'Dialing emergency number 112...'); }}
              >
                <Ionicons name="call" size={22} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sosActionText}>Call 112</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sosAction, { backgroundColor: '#eee', marginTop: 12 }]}
                onPress={() => setSosVisible(false)}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.sosActionText, { color: Colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 12,
    backgroundColor: Colors.reward,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  walletText: {
    color: Colors.text,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  sosButton: {
    marginLeft: 12,
  },
  profile: {
    marginLeft: 0,
  },
  inputContainer: {
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: Spacing.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#aeb4cf', // user input text
    backgroundColor: '#0c1037', // input background
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2e3e',
  },
  inputFocused: {
    borderColor: '#7243e1',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: Spacing.borderRadius,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  chips: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
    borderRadius: Spacing.borderRadius,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  map: {
    flex: 1,
    minHeight: 200,
  },
  sheetContent: {
    // flex: 1, // remove flex to allow content to shrink
    alignItems: 'center',
    paddingVertical: 8, // reduce vertical padding
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  sheetTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 16,
  },
  rideOptions: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  rideCard: {
    alignItems: 'center',
    width: 110,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#E6F0FF',
  },
  rideType: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: 6,
  },
  rideEta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  ridePrice: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  confirmBtn: {
    marginTop: 12, // was 24, reduce margin
    width: 180,
  },
  chatbotButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 2000,
  },
  sosButton: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    backgroundColor: Colors.error || '#FF3B30',
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 2000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: 300,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sosTitle: {
    ...Typography.h2,
    color: Colors.error || '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  sosDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 18,
    textAlign: 'center',
  },
  sosAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginVertical: 4,
    width: '100%',
  },
  sosActionText: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 16,
  },
  paymentSummary: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  testButton: {
    position: 'absolute',
    top: 10,
    right: 80,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rideOptionsMain: {
    marginTop: 12,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentSheetContent: {
    padding: 0,
    alignItems: 'center',
    backgroundColor: '#f9fafd',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  paymentSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    width: '92%',
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  paymentSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentSummaryText: {
    fontSize: 15,
    color: Colors.text,
    marginLeft: 8,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '92%',
    alignSelf: 'center',
    marginVertical: 10,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    alignSelf: 'center',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#e6f0ff',
  },
  paymentMethodText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  paymentButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  rideTypeSheetContent: {
    padding: 0,
    alignItems: 'center',
    backgroundColor: '#f9fafd',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  rideTypeSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    width: '92%',
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  rideTypeSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  rideTypeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rideTypeSummaryText: {
    fontSize: 15,
    color: Colors.text,
    marginLeft: 8,
  },
  rideTypeDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '92%',
    alignSelf: 'center',
    marginVertical: 10,
  },
  rideTypeOptionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    alignSelf: 'center',
  },
  rideTypeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  rideTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
  },
  selectedRideTypeCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#e6f0ff',
  },
  rideTypeOptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: 'bold',
  },
  rideTypeEta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  rideTypePrice: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  rideTypeButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#181c3a', // dark card background
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    elevation: 3,
    shadowColor: Colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
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
  inputBlockCard: {
    backgroundColor: '#0c1037',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', // subtle border
  },
  inputRowRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
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
  inputFocusedRedesigned: {
    color: '#ffffff',
  },
}); 