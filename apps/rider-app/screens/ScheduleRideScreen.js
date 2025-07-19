import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function ScheduleRideScreen({ navigation, route }) {
  const { from, to } = route.params || {};
  
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [pickupTime, setPickupTime] = useState('now');
  const [estimatedDropoff, setEstimatedDropoff] = useState(null);
  const [isScheduledRide, setIsScheduledRide] = useState(false);
  const [wasScheduled, setWasScheduled] = useState(false);
  
  // Custom time picker state
  const [customDate, setCustomDate] = useState(new Date());
  const [customHour, setCustomHour] = useState(new Date().getHours());
  const [customMinute, setCustomMinute] = useState(Math.ceil(new Date().getMinutes() / 5) * 5);

  // Add state to manage which modal is open
  const [pickerStep, setPickerStep] = useState(null); // null | 'date' | 'time'

  // Preset time options
  const timeOptions = [
    { id: 'now', label: 'Now', icon: 'flash', time: new Date() },
    { id: '10min', label: 'In 10 mins', icon: 'time', time: new Date(Date.now() + 10 * 60 * 1000) },
    { id: '30min', label: 'In 30 mins', icon: 'time', time: new Date(Date.now() + 30 * 60 * 1000) },
    { id: '1hour', label: 'In 1 hour', icon: 'time', time: new Date(Date.now() + 60 * 60 * 1000) },
    { id: 'custom', label: 'Custom Time', icon: 'calendar', time: null },
  ];

  // Calculate estimated drop-off time based on pickup time and mock duration
  const calculateEstimatedDropoff = (pickupTime) => {
    const now = new Date();
    const pickupDate = new Date(pickupTime);
    
    // Mock trip duration calculation (10-30 minutes based on location)
    const baseDuration = 15; // minutes
    const locationFactor = Math.abs(from?.length || 0 - to?.length || 0) % 20; // Simple mock factor
    const tripDuration = baseDuration + locationFactor;
    
    const dropoffTime = new Date(pickupDate.getTime() + tripDuration * 60 * 1000);
    
    return {
      duration: tripDuration,
      dropoffTime: dropoffTime,
      formattedDuration: `${tripDuration} min`,
      formattedDropoff: dropoffTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Handle time option selection
  const handleTimeOptionSelect = (option) => {
    setPickupTime(option.id);
    
    if (option.id === 'custom') {
      // For custom time, show the modal
      setPickerStep('date'); // Show date picker modal first
    } else {
      setSelectedTime(option.time);
      const estimated = calculateEstimatedDropoff(option.time);
      setEstimatedDropoff(estimated);
      const isNow = option.id === 'now';
      setIsScheduledRide(!isNow);
      // Show Alert only when switching from 'now' to a scheduled time
      if (!isNow && !wasScheduled) {
        Alert.alert(
          'Scheduled Ride',
          'This ride will be scheduled for the selected time. You can view and manage scheduled rides from your ride history.'
        );
      }
      setWasScheduled(!isNow);
    }
  };

  // Add handler for date confirm
  const handleCustomDateConfirm = () => {
    setPickerStep('time'); // After date, show time picker
  };

  // Handle custom time selection
  const handleCustomTimeConfirm = () => {
    const newCustomDate = new Date(customDate);
    newCustomDate.setHours(customHour, customMinute, 0, 0);
    
    // Ensure the time is in the future
    if (newCustomDate <= new Date()) {
      Alert.alert('Invalid Time', 'Please select a future time.');
      return;
    }
    
    setSelectedTime(newCustomDate);
    setPickupTime('custom');
    const estimated = calculateEstimatedDropoff(newCustomDate);
    setEstimatedDropoff(estimated);
    setIsScheduledRide(true);
    
    if (!wasScheduled) {
      Alert.alert(
        'Scheduled Ride',
        'This ride will be scheduled for the selected time. You can view and manage scheduled rides from your ride history.'
      );
    }
    setWasScheduled(true);
    setPickerStep(null); // Close all modals
  };

  // Handle custom time cancel
  const handleCustomTimeCancel = () => {
    setPickerStep(null);
    // Reset to 'now' if no custom time was previously selected
    if (pickupTime === 'custom') {
      resetToNow();
    }
  };

  // Add handleCustomDateCancel
  const handleCustomDateCancel = () => {
    setPickerStep(null);
    if (pickupTime === 'custom') {
      resetToNow();
    }
  };

  // Helper function to reset to 'now' state
  const resetToNow = () => {
    setPickupTime('now');
    setPickerStep(null); // Close all modals
    const estimated = calculateEstimatedDropoff(new Date());
    setEstimatedDropoff(estimated);
    setIsScheduledRide(false);
  };

  // Handle continue to ride type selection
  const handleContinue = () => {
    if (!from || !to) {
      Alert.alert('Error', 'Please enter both pickup and destination locations.');
      return;
    }

    // Navigate to ride type selection with scheduling info
    // Convert Date objects to ISO strings to avoid navigation state serialization issues
    navigation.navigate('RideTypeSelection', {
      from,
      to,
      pickupTime: selectedTime ? selectedTime.toISOString() : null,
      isScheduledRide,
      estimatedDropoff: estimatedDropoff ? {
        ...estimatedDropoff,
        dropoffTime: estimatedDropoff.dropoffTime ? estimatedDropoff.dropoffTime.toISOString() : null,
      } : null,
      scheduledFor: pickupTime === 'now' ? null : (selectedTime ? selectedTime.toISOString() : null),
    });
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

  // Initialize with "Now" option
  useEffect(() => {
    const estimated = calculateEstimatedDropoff(new Date());
    setEstimatedDropoff(estimated);
  }, [from, to]);

  // Generate time options for custom picker
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        options.push({
          hour,
          minute,
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        });
      }
    }
    return options;
  };

  const timeOptionsList = generateTimeOptions();

  return (
    <LinearGradient
      colors={[Colors.gradientTop, Colors.primary, Colors.gradientBottom, Colors.accent]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Schedule Your Ride</Text>
          <Text style={styles.subtitle}>When would you like to be picked up?</Text>
        </View>

        {/* Trip Summary Card */}
        <View style={styles.tripSummaryCard}>
          <View style={styles.tripSummaryHeader}>
            <Ionicons name="car-outline" size={24} color={Colors.primary} />
            <Text style={styles.tripSummaryTitle}>Trip Summary</Text>
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
          </View>
        </View>

        {/* Time Options */}
        <View style={styles.timeOptionsSection}>
          <Text style={styles.sectionTitle}>Pickup Time</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timeOptionCard,
                  pickupTime === option.id && styles.selectedTimeOption,
                ]}
                onPress={() => handleTimeOptionSelect(option)}
                activeOpacity={0.85}
              >
                <View style={styles.timeOptionContent}>
                  <View style={styles.timeOptionLeft}>
                    <Ionicons 
                      name={option.icon} 
                      size={24} 
                      color={pickupTime === option.id ? Colors.primary : Colors.textSecondary} 
                    />
                    <View style={styles.timeOptionText}>
                      <Text style={[
                        styles.timeOptionLabel,
                        pickupTime === option.id && styles.selectedTimeOptionText
                      ]}>
                        {option.label}
                      </Text>
                      {option.id !== 'custom' && (
                        <Text style={[
                          styles.timeOptionTime,
                          pickupTime === option.id && styles.selectedTimeOptionText
                        ]}>
                          {formatTime(option.time)} • {formatDate(option.time)}
                        </Text>
                      )}
                      {option.id === 'custom' && pickupTime === 'custom' && selectedTime && (
                        <Text style={[
                          styles.timeOptionTime,
                          pickupTime === option.id && styles.selectedTimeOptionText
                        ]}>
                          {formatTime(selectedTime)} • {formatDate(selectedTime)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Show checkmark if selected */}
                  {pickupTime === option.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} style={{ marginLeft: 8 }} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Estimated Drop-off Time */}
        {estimatedDropoff && (
          <View style={styles.estimatedCard}>
            <View style={styles.estimatedHeader}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.estimatedTitle}>Estimated Trip</Text>
            </View>
            
            <View style={styles.estimatedDetails}>
              <View style={styles.estimatedRow}>
                <Text style={styles.estimatedLabel}>Pickup:</Text>
                <Text style={styles.estimatedValue}>
                  {pickupTime === 'now' ? 'Now' : formatTime(selectedTime)}
                </Text>
              </View>
              
              <View style={styles.estimatedRow}>
                <Text style={styles.estimatedLabel}>Drop-off:</Text>
                <Text style={styles.estimatedValue}>
                  {estimatedDropoff.formattedDropoff}
                </Text>
              </View>
              
              <View style={styles.estimatedRow}>
                <Text style={styles.estimatedLabel}>Duration:</Text>
                <Text style={styles.estimatedValue}>
                  {estimatedDropoff.formattedDuration}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.buttonSection}>
          <Button
            title={isScheduledRide ? "Schedule Ride" : "Continue to Ride Selection"}
            icon={isScheduledRide ? "calendar" : "car-sport"}
            style={styles.continueButton}
            onPress={handleContinue}
          />
        </View>

        {/* Custom Date Picker Modal */}
        {pickerStep === 'date' && (
          <Modal
            visible={pickerStep === 'date'}
            animationType="fade"
            transparent
            onRequestClose={handleCustomDateCancel}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.customTimeModalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity onPress={handleCustomDateCancel} style={styles.closeIconBtn}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                {/* Calendar Picker - use a simple scrollable list for days for now */}
                <ScrollView style={{ width: '100%', maxHeight: 220 }} contentContainerStyle={{ alignItems: 'center' }}>
                  {Array.from({ length: 14 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isSelected = customDate.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.timePickerOptionBranded,
                          isSelected && styles.selectedTimePickerOptionBranded,
                          { width: '90%' },
                        ]}
                        onPress={() => setCustomDate(date)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.timePickerOptionTextBranded,
                          isSelected && styles.selectedTimePickerOptionTextBranded
                        ]}>
                          {date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.modalButtonsBranded}>
                  <Button
                    title="Cancel"
                    icon="close"
                    style={[styles.modalButtonBranded, styles.cancelButtonBranded]}
                    onPress={handleCustomDateCancel}
                  />
                  <Button
                    title="Confirm"
                    icon="checkmark"
                    style={[styles.modalButtonBranded, styles.confirmButtonBranded]}
                    onPress={handleCustomDateConfirm}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
        {/* Custom Time Picker Modal */}
        {pickerStep === 'time' && (
          <Modal
            visible={pickerStep === 'time'}
            animationType="fade"
            transparent
            onRequestClose={handleCustomTimeCancel}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.customTimeModalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Select Custom Time</Text>
                  <TouchableOpacity onPress={handleCustomTimeCancel} style={styles.closeIconBtn}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                {/* Show selected date for context */}
                <Text style={{ color: Colors.textSecondary, marginBottom: 8, fontFamily: Typography.fontFamily, fontSize: 16, alignSelf: 'center' }}>
                  {customDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.timePickerContainerBranded}>
                  <View style={styles.timePickerColumnBranded}>
                    <Text style={styles.timePickerLabelBranded}>Hour</Text>
                    <ScrollView style={styles.timePickerScrollBranded} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timePickerOptionBranded,
                            customHour === i && styles.selectedTimePickerOptionBranded
                          ]}
                          onPress={() => setCustomHour(i)}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.timePickerOptionTextBranded,
                            customHour === i && styles.selectedTimePickerOptionTextBranded
                          ]}>
                            {i.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumnBranded}>
                    <Text style={styles.timePickerLabelBranded}>Minute</Text>
                    <ScrollView style={styles.timePickerScrollBranded} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                      {Array.from({ length: 12 }, (_, i) => {
                        const minute = i * 5;
                        return (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              styles.timePickerOptionBranded,
                              customMinute === minute && styles.selectedTimePickerOptionBranded
                            ]}
                            onPress={() => setCustomMinute(minute)}
                            activeOpacity={0.8}
                          >
                            <Text style={[
                              styles.timePickerOptionTextBranded,
                              customMinute === minute && styles.selectedTimePickerOptionTextBranded
                            ]}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                <View style={styles.modalButtonsBranded}>
                  <Button
                    title="Cancel"
                    icon="close"
                    style={[styles.modalButtonBranded, styles.cancelButtonBranded]}
                    onPress={handleCustomTimeCancel}
                  />
                  <Button
                    title="Confirm"
                    icon="checkmark"
                    style={[styles.modalButtonBranded, styles.confirmButtonBranded]}
                    onPress={handleCustomTimeConfirm}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
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
    marginBottom: 16,
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
  },
  tripSummaryCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
  timeOptionsSection: {
    flex: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 16,
  },
  timeOptionCard: {
    backgroundColor: '#0c1037',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    // Remove shadow for unselected
    elevation: 0,
    shadowColor: 'transparent',
  },
  selectedTimeOption: {
    backgroundColor: '#181c3a', // More solid, high-contrast background
    borderColor: Colors.primary,
    borderWidth: 2,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  timeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  timeOptionLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: 2,
  },
  timeOptionTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedTimeOptionText: {
    color: '#fff', // White for max contrast on selected
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  estimatedCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  estimatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  estimatedTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginLeft: 8,
  },
  estimatedDetails: {
    gap: 8,
  },
  estimatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  estimatedValue: {
    ...Typography.bodyBold,
    color: Colors.text,
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
  buttonSection: {
    marginBottom: 20,
  },
  continueButton: {
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  customTimeModalCard: {
    backgroundColor: '#181c3a',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: 480,
    padding: 24,
    alignItems: 'center',
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  modalTitle: {
    ...Typography.h3,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily,
  },
  closeIconBtn: {
    padding: 8,
    marginLeft: 8,
  },
  timePickerContainerBranded: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    marginTop: 8,
  },
  timePickerColumnBranded: {
    alignItems: 'center',
    width: 90,
  },
  timePickerLabelBranded: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    marginBottom: 10,
    fontFamily: Typography.fontFamily,
    fontSize: 16,
  },
  timePickerScrollBranded: {
    width: '100%',
    maxHeight: 220,
  },
  timePickerOptionBranded: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 18,
    marginVertical: 3,
    alignItems: 'center',
    width: 60,
  },
  selectedTimePickerOptionBranded: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
  },
  timePickerOptionTextBranded: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontFamily: Typography.fontFamily,
    fontSize: 22,
  },
  selectedTimePickerOptionTextBranded: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  modalButtonsBranded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
  },
  modalButtonBranded: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  cancelButtonBranded: {
    backgroundColor: Colors.textSecondary,
  },
  confirmButtonBranded: {
    backgroundColor: Colors.primary,
  },
}); 