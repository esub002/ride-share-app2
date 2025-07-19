import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Modal, // Added Modal import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@gorhom/bottom-sheet';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';

const rideOptions = [
  { type: 'Economy', icon: 'car-outline', eta: '2 min', price: '$8' },
  { type: 'Premium', icon: 'car-sport-outline', eta: '4 min', price: '$14' },
  { type: 'Pool', icon: 'people-outline', eta: '3 min', price: '$5' },
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
  // Defensive: wrap string children in <Text>
  const safeChildren = React.Children.map(children, child =>
    typeof child === 'string' ? <Text>{child}</Text> : child
  );
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {safeChildren}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RideTypeSelectionScreen({ navigation, route }) {
  const { from, to, pickupTime: pickupTimeString, isScheduledRide, estimatedDropoff: estimatedDropoffData, scheduledFor: scheduledForString } = route.params || {};
  
  // Convert ISO string dates back to Date objects
  const pickupTime = pickupTimeString ? new Date(pickupTimeString) : new Date();
  const scheduledFor = scheduledForString ? new Date(scheduledForString) : null;
  const estimatedDropoff = estimatedDropoffData ? {
    ...estimatedDropoffData,
    dropoffTime: estimatedDropoffData.dropoffTime ? new Date(estimatedDropoffData.dropoffTime) : null,
  } : null;
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideWithPet, setRideWithPet] = useState(false);
  const [loading, setLoading] = useState(false);
  const rideTypeSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['60%', '75%'], []);
  const [showScheduleInfo, setShowScheduleInfo] = useState(false); // New state for modal

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

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
  };

  const handlePetToggle = () => {
    setRideWithPet(!rideWithPet);
  };

  const handleConfirm = () => {
    if (!selectedRide) {
      Alert.alert('Select Ride Type', 'Please select a ride type to continue.');
      return;
    }

    // Navigate to payment screen with all ride details including pet option
    // Convert Date objects to ISO strings to avoid navigation state serialization issues
    navigation.navigate('Payment', {
      from,
      to,
      selectedRide,
      pickupTime: pickupTime ? pickupTime.toISOString() : null,
      isScheduledRide,
      estimatedDropoff: estimatedDropoff ? {
        ...estimatedDropoff,
        dropoffTime: estimatedDropoff.dropoffTime ? estimatedDropoff.dropoffTime.toISOString() : null,
      } : null,
      scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
      rideWithPet,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={[Colors.gradientTop, Colors.primary, Colors.gradientBottom, Colors.accent]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.container, { flex: 1, justifyContent: 'space-between' }]}> {/* Ensure button is pinned to bottom */}
        {/* Header */}
        <View style={styles.header}> {/* Updated header layout */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerRowWithIcon}> {/* New header row for title and icon */}
            <Text style={styles.title}>Choose Your Ride</Text>
            {isScheduledRide && (
              <TouchableOpacity
                style={styles.scheduledIconBtn}
                onPress={() => setShowScheduleInfo(true)}
                accessibilityLabel="Show scheduled ride info"
              >
                <Ionicons name="calendar-outline" size={28} color={Colors.warning} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>{isScheduledRide ? 'Scheduled Ride' : 'Instant Ride'}</Text>
        </View>
        {/* Trip Summary Card */}
        <View style={styles.tripSummaryCard}>
          <View style={styles.tripSummaryHeader}>
            <Ionicons name="car-outline" size={24} color={Colors.primary} />
            <Text style={styles.tripSummaryTitle}>Trip Details</Text>
          </View>
          
          <View style={styles.tripDetails}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                <Text style={styles.locationLabel}>From: </Text>
                {from || 'Pickup location'}
              </Text>
            </View>
            
            <View style={styles.locationRow}>
              <Ionicons name="flag-outline" size={18} color={Colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                <Text style={styles.locationLabel}>To: </Text>
                {to || 'Destination'}
              </Text>
            </View>

            {/* Scheduling Information */}
            <View style={styles.schedulingRow}>
              <Ionicons 
                name={isScheduledRide ? "calendar-outline" : "flash-outline"} 
                size={18} 
                color={isScheduledRide ? Colors.warning : Colors.success} 
              />
              <Text style={styles.schedulingText}>
                <Text style={styles.schedulingLabel}>Pickup: </Text>
                {isScheduledRide 
                  ? `${formatTime(pickupTime)} • ${formatDate(pickupTime)}`
                  : 'Now'
                }
              </Text>
            </View>

            {estimatedDropoff && (
              <View style={styles.schedulingRow}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text style={styles.schedulingText}>
                  <Text style={styles.schedulingLabel}>Duration: </Text>
                  {estimatedDropoff.formattedDuration}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remove the full-width scheduledNotice banner here */}
        {/* Modal for scheduled ride info */}
        {isScheduledRide && showScheduleInfo && (
          <Modal
            visible={showScheduleInfo}
            animationType="fade"
            transparent
            onRequestClose={() => setShowScheduleInfo(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.scheduleInfoModalCard}>
                <Ionicons name="calendar-outline" size={32} color={Colors.warning} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Text style={styles.scheduleInfoTitle}>Scheduled Ride</Text>
                <Text style={styles.scheduleInfoText}>
                  This ride is scheduled for {formatTime(pickupTime)} • {formatDate(pickupTime)}
                </Text>
                <Button
                  title="Close"
                  icon="close"
                  style={styles.scheduleInfoCloseBtn}
                  onPress={() => setShowScheduleInfo(false)}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Ride Type Selection */}
        <View style={styles.rideTypeSection}>
          <Text style={styles.sectionTitle}>Select Ride Type</Text>
          
          <View style={styles.rideTypeOptions}>
            {rideOptions.map((ride) => (
              <AnimatedTouchable
                key={ride.type}
                style={[
                  styles.rideTypeCard,
                  selectedRide?.type === ride.type && styles.selectedRideTypeCard,
                  { opacity: selectedRide ? (selectedRide.type === ride.type ? 1 : 0.67) : 1 },
                ]}
                onPress={() => handleRideSelect(ride)}
              >
                <Ionicons 
                  name={ride.icon} 
                  size={32} 
                  color={selectedRide?.type === ride.type ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[
                  styles.rideTypeText,
                  selectedRide?.type === ride.type && styles.selectedRideTypeText
                ]}>
                  {ride.type}
                </Text>
                <Text style={styles.rideEta}>{ride.eta}</Text>
                <Text style={styles.ridePrice}>{ride.price}</Text>
              </AnimatedTouchable>
            ))}
          </View>
        </View>

        {/* Pet Option */}
        <View style={styles.petSection}>
          <TouchableOpacity
            style={[
              styles.petOptionCard,
              rideWithPet && styles.selectedPetOptionCard,
            ]}
            onPress={handlePetToggle}
            activeOpacity={0.8}
          >
            <View style={styles.petOptionContent}>
              <View style={styles.petOptionLeft}>
                <Ionicons 
                  name="paw" 
                  size={24} 
                  color={rideWithPet ? Colors.primary : Colors.textSecondary} 
                />
                <View style={styles.petOptionText}>
                  <Text style={[
                    styles.petOptionLabel,
                    rideWithPet && styles.selectedPetOptionText
                  ]}>
                    Ride with Pet
                  </Text>
                  <Text style={[
                    styles.petOptionSubtext,
                    rideWithPet && styles.selectedPetOptionSubtext
                  ]}>
                    Match with pet-friendly drivers
                  </Text>
                </View>
              </View>
              {/* Checkbox */}
              <View style={[
                styles.petCheckbox,
                rideWithPet && styles.petCheckboxChecked
              ]}>
                {rideWithPet && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        <View style={styles.buttonSection}>
          <Button
            title={loading ? "Processing..." : (isScheduledRide ? "Schedule Ride" : "Confirm Ride")}
            icon={isScheduledRide ? "calendar" : "checkmark"}
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!selectedRide || loading}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: Spacing.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 32,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    padding: 8,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tripSummaryCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tripSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripSummaryTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginLeft: 8,
  },
  tripDetails: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  locationLabel: {
    color: Colors.text,
    fontWeight: '600',
  },
  schedulingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schedulingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  schedulingLabel: {
    color: Colors.text,
    fontWeight: '600',
  },
  scheduledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,149,0,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.3)',
  },
  scheduledText: {
    ...Typography.body,
    color: Colors.warning,
    marginLeft: 8,
  },
  rideTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 16,
  },
  rideTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rideTypeCard: {
    flex: 1,
    backgroundColor: '#0c1037',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    // Add transition for smoothness
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '0.2s',
  },
  selectedRideTypeCard: {
    borderColor: Colors.primary,
    backgroundColor: '#181c3a', // More solid, high-contrast background
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  rideTypeText: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
    // Add text shadow for subtle glow
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedRideTypeText: {
    color: '#fff', // Pure white for selected
    fontWeight: 'bold',
    textShadowColor: 'rgba(58,116,229,0.25)', // Subtle blue glow
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  rideEta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ridePrice: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  petSection: {
    marginBottom: 24,
  },
  petOptionCard: {
    backgroundColor: '#0c1037',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '0.2s',
  },
  selectedPetOptionCard: {
    borderColor: Colors.primary,
    backgroundColor: '#181c3a', // Match selected ride type
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  petOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  petOptionLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedPetOptionText: {
    color: '#fff', // Pure white for selected
    fontWeight: 'bold',
    textShadowColor: 'rgba(58,116,229,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  petOptionSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedPetOptionSubtext: {
    color: '#fff', // White for selected subtext
    opacity: 1,
    fontWeight: 'bold',
    textShadowColor: 'rgba(58,116,229,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  petCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCheckboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonSection: {
    marginBottom: 20,
  },
  confirmButton: {
    marginBottom: 0,
  },
  // New styles for header row with icon
  headerRowWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginTop: 8,
  },
  scheduledIconBtn: {
    padding: 8,
  },
  // New styles for modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scheduleInfoModalCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scheduleInfoTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 12,
  },
  scheduleInfoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  scheduleInfoCloseBtn: {
    width: '100%',
  },
}); 