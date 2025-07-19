import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';

export default function TermsScreen({ navigation, route }) {
  const { firstName, lastName, phoneNumber, countryCode, socialProvider } = route.params || {};
  const { completeOnboarding, hasTrustedContact } = useAuth();
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms & Conditions to continue');
      return;
    }

    setLoading(true);

    // Use the AuthContext method to complete onboarding
    const success = await completeOnboarding({
      firstName,
      lastName,
      phoneNumber,
      countryCode,
      socialProvider,
    });

    setLoading(false);

    if (success) {
      if (!hasTrustedContact()) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'OnboardingTrustedContact' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    } else {
      Alert.alert('Error', 'Failed to create account. Please try again.');
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
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Please read and accept our terms to continue</Text>
        </View>

        {/* Terms Content */}
        <View style={styles.termsSection}>
          <View style={styles.inputBlockShadow}>
            <View style={styles.inputBlockCard}>
              <ScrollView 
                style={styles.termsScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.termsContent}
              >
                <Text style={styles.termsTitle}>RideShare Terms of Service</Text>
                
                <Text style={styles.termsSectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.termsText}>
                  By accessing and using the RideShare application, you accept and agree to be bound by the terms and provision of this agreement.
                </Text>

                <Text style={styles.termsSectionTitle}>2. User Responsibilities</Text>
                <Text style={styles.termsText}>
                  You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
                </Text>

                <Text style={styles.termsSectionTitle}>3. Safety and Conduct</Text>
                <Text style={styles.termsText}>
                  Users must behave respectfully and safely during rides. Any form of harassment, violence, or illegal activity will result in immediate account termination.
                </Text>

                <Text style={styles.termsSectionTitle}>4. Payment Terms</Text>
                <Text style={styles.termsText}>
                  All payments are processed securely through our payment partners. Fares are calculated based on distance, time, and demand.
                </Text>

                <Text style={styles.termsSectionTitle}>5. Privacy Policy</Text>
                <Text style={styles.termsText}>
                  We collect and use your personal information as described in our Privacy Policy to provide and improve our services.
                </Text>

                <Text style={styles.termsSectionTitle}>6. Service Availability</Text>
                <Text style={styles.termsText}>
                  RideShare services are subject to availability and may vary by location. We do not guarantee service availability at all times.
                </Text>

                <Text style={styles.termsSectionTitle}>7. Limitation of Liability</Text>
                <Text style={styles.termsText}>
                  RideShare is not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                </Text>

                <Text style={styles.termsSectionTitle}>8. Changes to Terms</Text>
                <Text style={styles.termsText}>
                  We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                </Text>

                <Text style={styles.termsFooter}>
                  Last updated: {new Date().toLocaleDateString()}
                </Text>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Checkbox Section */}
        <View style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxText}>
              I have read and agree to the Terms & Conditions and Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Complete Button */}
        <View style={styles.buttonSection}>
          <Button
            title={loading ? "Creating Account..." : "Continue to Welcome"}
            icon="checkmark-circle"
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={!acceptedTerms || loading}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>Your account is secure</Text>
            <Text style={styles.infoText}>
              We use industry-standard security measures to protect your data
            </Text>
          </View>
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
  termsSection: {
    flex: 1,
    marginBottom: 24,
  },
  inputBlockShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
  },
  inputBlockCard: {
    backgroundColor: '#0c1037',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 300,
  },
  termsScroll: {
    flex: 1,
  },
  termsContent: {
    paddingBottom: 20,
  },
  termsTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  termsSectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  termsText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  termsFooter: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  checkboxSection: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a2e3e',
    backgroundColor: '#1c1f65',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
  buttonSection: {
    marginBottom: 24,
  },
  completeButton: {
    marginBottom: 0,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
}); 