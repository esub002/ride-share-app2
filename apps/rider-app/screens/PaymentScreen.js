import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';

const paymentMethods = [
  { type: 'Card', icon: 'card-outline', last4: '4242' },
  { type: 'UPI', icon: 'logo-google', id: 'user@upi' },
  { type: 'Wallet', icon: 'wallet-outline', balance: '$45.75' },
  { type: 'Cash', icon: 'cash-outline' },
];

export default function PaymentScreen({ navigation, route }) {
  const { 
    from, 
    to, 
    selectedRide, 
    pickupTime: pickupTimeString, 
    isScheduledRide, 
    estimatedDropoff: estimatedDropoffData, 
    scheduledFor: scheduledForString,
    rideWithPet,
  } = route.params || {};
  
  // Convert ISO string dates back to Date objects
  const pickupTime = pickupTimeString ? new Date(pickupTimeString) : new Date();
  const scheduledFor = scheduledForString ? new Date(scheduledForString) : null;
  const estimatedDropoff = estimatedDropoffData ? {
    ...estimatedDropoffData,
    dropoffTime: estimatedDropoffData.dropoffTime ? new Date(estimatedDropoffData.dropoffTime) : null,
  } : null;
  
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [loading, setLoading] = useState(false);

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

  const handlePaymentSelect = (payment) => {
    setSelectedPayment(payment);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Select Payment Method', 'Please select a payment method to continue.');
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      Alert.alert(
        isScheduledRide ? 'Ride Scheduled!' : 'Ride Booked!',
        isScheduledRide 
          ? `Your ride has been scheduled for ${formatTime(pickupTime)} • ${formatDate(pickupTime)}`
          : 'Your ride has been booked successfully!',
        [
          {
            text: 'View Ride Status',
            onPress: () => {
              // Navigate to ride status screen
              // Convert Date objects to ISO strings to avoid navigation state serialization issues
              navigation.navigate('RideStatus', {
                rideId: `ride_${Date.now()}`,
                isScheduledRide,
                scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
                from,
                to,
                selectedRide,
                estimatedDropoff: estimatedDropoff ? {
                  ...estimatedDropoff,
                  dropoffTime: estimatedDropoff.dropoffTime ? estimatedDropoff.dropoffTime.toISOString() : null,
                } : null,
                rideWithPet,
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Payment</Text>
          <Text style={styles.subtitle}>
            {isScheduledRide ? 'Schedule your ride' : 'Complete your booking'}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
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

              {/* Ride Type */}
              <View style={styles.locationRow}>
                <Ionicons name="car-sport-outline" size={18} color={Colors.primary} />
                <Text style={styles.locationText}>
                  <Text style={styles.locationLabel}>Ride Type: </Text>
                  {selectedRide?.type || 'Economy'}
                </Text>
              </View>

              {/* Pet Option */}
              {rideWithPet && (
                <View style={styles.locationRow}>
                  <Ionicons name="paw" size={18} color={Colors.primary} />
                  <Text style={styles.locationText}>
                    <Text style={styles.locationLabel}>Pet-friendly: </Text>
                    Yes
                  </Text>
                </View>
              )}

              {/* Scheduling Information */}
              <View style={styles.locationRow}>
                <Ionicons 
                  name={isScheduledRide ? "calendar-outline" : "flash-outline"} 
                  size={18} 
                  color={isScheduledRide ? Colors.warning : Colors.success} 
                />
                <Text style={styles.locationText}>
                  <Text style={styles.locationLabel}>Pickup: </Text>
                  {isScheduledRide 
                    ? `${formatTime(pickupTime)} • ${formatDate(pickupTime)}`
                    : 'Now'
                  }
                </Text>
              </View>

              {estimatedDropoff && (
                <View style={styles.locationRow}>
                  <Ionicons name="time-outline" size={18} color={Colors.primary} />
                  <Text style={styles.locationText}>
                    <Text style={styles.locationLabel}>Duration: </Text>
                    {estimatedDropoff.formattedDuration}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Ionicons name="pricetag-outline" size={24} color={Colors.primary} />
              <Text style={styles.priceTitle}>Price Breakdown</Text>
            </View>
            
            <View style={styles.priceDetails}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Base Fare</Text>
                <Text style={styles.priceValue}>${selectedRide?.price?.replace('$', '') || '8'}</Text>
              </View>
              
              {isScheduledRide && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Scheduling Fee</Text>
                  <Text style={styles.priceValue}>$2.00</Text>
                </View>
              )}
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service Fee</Text>
                <Text style={styles.priceValue}>$1.50</Text>
              </View>
              
              <View style={styles.priceDivider} />
              
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${isScheduledRide 
                    ? (parseInt(selectedRide?.price?.replace('$', '') || '8') + 3.5).toFixed(2)
                    : (parseInt(selectedRide?.price?.replace('$', '') || '8') + 1.5).toFixed(2)
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {paymentMethods.map((payment) => (
              <TouchableOpacity
                key={payment.type}
                style={[
                  styles.paymentMethodCard,
                  selectedPayment?.type === payment.type && styles.selectedPaymentMethod,
                ]}
                onPress={() => handlePaymentSelect(payment)}
              >
                <View style={styles.paymentMethodContent}>
                  <View style={styles.paymentMethodLeft}>
                    <Ionicons 
                      name={payment.icon} 
                      size={24} 
                      color={selectedPayment?.type === payment.type ? Colors.primary : Colors.textSecondary} 
                    />
                    <View style={styles.paymentMethodText}>
                      <Text style={[
                        styles.paymentMethodLabel,
                        selectedPayment?.type === payment.type && styles.selectedPaymentText
                      ]}>
                        {payment.type}
                      </Text>
                      {payment.last4 && (
                        <Text style={styles.paymentMethodSubtext}>•••• {payment.last4}</Text>
                      )}
                      {payment.id && (
                        <Text style={styles.paymentMethodSubtext}>{payment.id}</Text>
                      )}
                      {payment.balance && (
                        <Text style={styles.paymentMethodSubtext}>{payment.balance}</Text>
                      )}
                    </View>
                  </View>
                  
                  {selectedPayment?.type === payment.type && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scheduled Ride Notice */}
          {isScheduledRide && (
            <View style={styles.scheduledNotice}>
              <Ionicons name="calendar-outline" size={20} color={Colors.warning} />
              <Text style={styles.scheduledText}>
                This ride will be scheduled for {formatTime(pickupTime)} • {formatDate(pickupTime)}
              </Text>
            </View>
          )}

          {/* Pet-friendly Notice */}
          {rideWithPet && (
            <View style={styles.petNotice}>
              <Ionicons name="paw" size={20} color={Colors.primary} />
              <Text style={styles.petText}>
                You'll be matched with pet-friendly drivers only
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Confirm Payment Button */}
        <View style={styles.buttonSection}>
          <Button
            title={loading ? "Processing..." : (isScheduledRide ? "Schedule & Pay" : "Pay & Book")}
            icon={isScheduledRide ? "calendar" : "card"}
            style={styles.confirmButton}
            onPress={handleConfirmPayment}
            disabled={!selectedPayment || loading}
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
  scrollContent: {
    flex: 1,
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
  priceCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginLeft: 8,
  },
  priceDetails: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  priceValue: {
    ...Typography.body,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  totalLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  totalValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#0c1037',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(58,116,229,0.1)',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedPaymentText: {
    color: Colors.primary,
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
  confirmButton: {
    marginBottom: 0,
  },
  petNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100,221,23,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(100,221,23,0.3)',
  },
  petText: {
    ...Typography.body,
    color: Colors.success,
    marginLeft: 8,
  },
}); 