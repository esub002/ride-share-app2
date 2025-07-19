import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Button from '../components/ui/Button';
import { ErrorContext } from '../App';
import apiService from '../utils/api';

export default function Onboarding({ navigation }) {
  const { setError } = useContext(ErrorContext);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);

  const handleSubmit = async (onboardingData) => {
    setSubmitting(true);
    setOnboardingError(null);
    try {
      await apiService.request('/onboarding/submit', { method: 'POST', body: JSON.stringify(onboardingData) }, "Failed to submit onboarding info. Please try again.");
      // ...success logic
    } catch (error) {
      setOnboardingError("Failed to submit onboarding info. Please try again.");
      setError("Failed to submit onboarding info. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRegistration = () => {
    navigation.navigate('Login');
  };

  const handleComprehensiveRegistration = () => {
    navigation.navigate('DriverLogin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Driver App</Text>
          <Text style={styles.subtitle}>Choose your registration method</Text>
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.optionCard}>
            <Text style={styles.optionTitle}>Quick Registration</Text>
            <Text style={styles.optionDescription}>
              Basic registration with email and password. 
              Verification can be completed later.
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>• Email and password only</Text>
              <Text style={styles.feature}>• Quick setup</Text>
              <Text style={styles.feature}>• Verification required later</Text>
            </View>
            <Button
              title="Start Quick Registration"
              onPress={handleQuickRegistration}
              variant="secondary"
              style={styles.optionButton}
            />
          </View>

          <View style={styles.optionCard}>
            <Text style={styles.optionTitle}>Comprehensive Registration</Text>
            <Text style={styles.optionDescription}>
              Complete verification process with all required documents.
              Start driving immediately after approval.
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>• Phone verification</Text>
              <Text style={styles.feature}>• SSN background check</Text>
              <Text style={styles.feature}>• Driver's license verification</Text>
              <Text style={styles.feature}>• Insurance verification</Text>
              <Text style={styles.feature}>• Complete profile setup</Text>
              <Text style={styles.feature}>• Ready to drive immediately</Text>
            </View>
            <Button
              title="Start Comprehensive Registration"
              onPress={handleComprehensiveRegistration}
              variant="primary"
              style={styles.optionButton}
            />
          </View>
        </View>

        {onboardingError && (
          <Text style={styles.errorText}>{onboardingError}</Text>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Choose Comprehensive Registration?</Text>
          <Text style={styles.infoText}>
            Comprehensive registration includes all necessary verifications upfront, 
            allowing you to start accepting rides immediately after approval. 
            This process typically takes 10-15 minutes to complete.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1037',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aeb4cf',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2e3e',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#aeb4cf',
    marginBottom: 15,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    color: '#72809b',
    marginBottom: 4,
  },
  optionButton: {
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  infoSection: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2e3e',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#aeb4cf',
    lineHeight: 20,
  },
}); 