import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../auth/AuthContext';
import { Colors } from '../constants/Colors';

const STEPS = {
  PHONE_VERIFICATION: 0,
  SSN_VERIFICATION: 1,
  DRIVERS_LICENSE: 2,
  INSURANCE_VERIFICATION: 3,
  BACKGROUND_CHECK: 4,
  PROFILE_CREATION: 5,
  COMPLETED: 6,
};

export default function DriverLoginScreen({ navigation }) {
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.PHONE_VERIFICATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data for each step
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    ssn: '',
    driversLicense: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    address: '',
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      plateNumber: '',
      color: '',
    },
  });

  // Background check status
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState('pending');
  const [verificationProgress, setVerificationProgress] = useState({
    phone: false,
    ssn: false,
    license: false,
    insurance: false,
    background: false,
    profile: false,
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateVehicleInfo = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        ...prev.vehicleInfo,
        [field]: value,
      },
    }));
  };

  // Step 1: Phone Verification
  const handlePhoneVerification = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate phone verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationProgress(prev => ({ ...prev, phone: true }));
      setCurrentStep(STEPS.SSN_VERIFICATION);
    } catch (error) {
      setError('Phone verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: SSN Verification
  const handleSSNVerification = async () => {
    if (!formData.ssn || formData.ssn.length !== 9) {
      setError('Please enter a valid 9-digit SSN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate SSN verification with background check
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setVerificationProgress(prev => ({ ...prev, ssn: true }));
      setCurrentStep(STEPS.DRIVERS_LICENSE);
    } catch (error) {
      setError('SSN verification failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Driver's License Verification
  const handleLicenseVerification = async () => {
    if (!formData.driversLicense || formData.driversLicense.length < 8) {
      setError('Please enter a valid driver\'s license number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate license verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationProgress(prev => ({ ...prev, license: true }));
      setCurrentStep(STEPS.INSURANCE_VERIFICATION);
    } catch (error) {
      setError('License verification failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Insurance Verification
  const handleInsuranceVerification = async () => {
    if (!formData.insuranceNumber || !formData.insuranceExpiry) {
      setError('Please enter valid insurance information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate insurance verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationProgress(prev => ({ ...prev, insurance: true }));
      setCurrentStep(STEPS.BACKGROUND_CHECK);
    } catch (error) {
      setError('Insurance verification failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Background Check
  const handleBackgroundCheck = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulate comprehensive background check
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setBackgroundCheckStatus('completed');
      setVerificationProgress(prev => ({ ...prev, background: true }));
      setCurrentStep(STEPS.PROFILE_CREATION);
    } catch (error) {
      setError('Background check failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Profile Creation
  const handleProfileCreation = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate profile creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationProgress(prev => ({ ...prev, profile: true }));
      setCurrentStep(STEPS.COMPLETED);
      
      // Navigate to main app
      setTimeout(() => {
        navigation.replace('DriverHome');
      }, 1000);
    } catch (error) {
      setError('Profile creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      'Phone Verification',
      'SSN Verification',
      'Driver\'s License',
      'Insurance',
      'Background Check',
      'Profile Creation',
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index === currentStep ? styles.stepActive : 
              index < currentStep ? styles.stepCompleted : styles.stepPending
            ]}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <Text style={[
              styles.stepText,
              index === currentStep ? styles.stepTextActive : 
              index < currentStep ? styles.stepTextCompleted : styles.stepTextPending
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPhoneVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Phone Verification</Text>
      <Text style={styles.stepDescription}>
        Enter your phone number to receive a verification code
      </Text>
      
      <Input
        placeholder="Phone Number"
        value={formData.phone}
        onChangeText={(text) => updateFormData('phone', text)}
        keyboardType="phone-pad"
        style={styles.input}
      />
      
      <Button
        title="Send Verification Code"
        onPress={handlePhoneVerification}
        disabled={loading}
        style={styles.button}
      />
    </View>
  );

  const renderSSNVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>SSN Verification</Text>
      <Text style={styles.stepDescription}>
        Enter your Social Security Number for background verification
      </Text>
      
      <Input
        placeholder="SSN (9 digits)"
        value={formData.ssn}
        onChangeText={(text) => updateFormData('ssn', text.replace(/\D/g, '').slice(0, 9))}
        keyboardType="numeric"
        secureTextEntry
        style={styles.input}
      />
      
      <Button
        title="Verify SSN"
        onPress={handleSSNVerification}
        disabled={loading}
        style={styles.button}
      />
    </View>
  );

  const renderDriversLicense = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Driver's License Verification</Text>
      <Text style={styles.stepDescription}>
        Enter your driver's license number for verification
      </Text>
      
      <Input
        placeholder="Driver's License Number"
        value={formData.driversLicense}
        onChangeText={(text) => updateFormData('driversLicense', text.toUpperCase())}
        style={styles.input}
      />
      
      <Button
        title="Verify License"
        onPress={handleLicenseVerification}
        disabled={loading}
        style={styles.button}
      />
    </View>
  );

  const renderInsuranceVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Insurance Verification</Text>
      <Text style={styles.stepDescription}>
        Enter your vehicle insurance information
      </Text>
      
      <Input
        placeholder="Insurance Policy Number"
        value={formData.insuranceNumber}
        onChangeText={(text) => updateFormData('insuranceNumber', text)}
        style={styles.input}
      />
      
      <Input
        placeholder="Insurance Expiry Date (MM/YYYY)"
        value={formData.insuranceExpiry}
        onChangeText={(text) => updateFormData('insuranceExpiry', text)}
        style={styles.input}
      />
      
      <Button
        title="Verify Insurance"
        onPress={handleInsuranceVerification}
        disabled={loading}
        style={styles.button}
      />
    </View>
  );

  const renderBackgroundCheck = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Background Check</Text>
      <Text style={styles.stepDescription}>
        We're conducting a comprehensive background check. This may take a few minutes.
      </Text>
      
      <View style={styles.backgroundCheckStatus}>
        <Text style={styles.statusText}>
          Status: {backgroundCheckStatus === 'pending' ? 'In Progress...' : 'Completed'}
        </Text>
        {backgroundCheckStatus === 'pending' && (
          <LoadingSpinner size="small" text="Checking..." />
        )}
      </View>
      
      <Button
        title="Start Background Check"
        onPress={handleBackgroundCheck}
        disabled={loading}
        style={styles.button}
      />
    </View>
  );

  const renderProfileCreation = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepDescription}>
        Please provide your personal and vehicle information
      </Text>
      
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <Input
        placeholder="First Name"
        value={formData.firstName}
        onChangeText={(text) => updateFormData('firstName', text)}
        style={styles.input}
      />
      
      <Input
        placeholder="Last Name"
        value={formData.lastName}
        onChangeText={(text) => updateFormData('lastName', text)}
        style={styles.input}
      />
      
      <Input
        placeholder="Email Address"
        value={formData.email}
        onChangeText={(text) => updateFormData('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <Input
        placeholder="Date of Birth (MM/DD/YYYY)"
        value={formData.dateOfBirth}
        onChangeText={(text) => updateFormData('dateOfBirth', text)}
        style={styles.input}
      />
      
      <Input
        placeholder="Address"
        value={formData.address}
        onChangeText={(text) => updateFormData('address', text)}
        multiline
        style={styles.input}
      />
      
      <Text style={styles.sectionTitle}>Vehicle Information</Text>
      <Input
        placeholder="Vehicle Make"
        value={formData.vehicleInfo.make}
        onChangeText={(text) => updateVehicleInfo('make', text)}
        style={styles.input}
      />
      
      <Input
        placeholder="Vehicle Model"
        value={formData.vehicleInfo.model}
        onChangeText={(text) => updateVehicleInfo('model', text)}
        style={styles.input}
      />
      
      <Input
        placeholder="Vehicle Year"
        value={formData.vehicleInfo.year}
        onChangeText={(text) => updateVehicleInfo('year', text)}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <Input
        placeholder="License Plate Number"
        value={formData.vehicleInfo.plateNumber}
        onChangeText={(text) => updateVehicleInfo('plateNumber', text.toUpperCase())}
        style={styles.input}
      />
      
      <Input
        placeholder="Vehicle Color"
        value={formData.vehicleInfo.color}
        onChangeText={(text) => updateVehicleInfo('color', text)}
        style={styles.input}
      />
      
      <Button
        title="Complete Registration"
        onPress={handleProfileCreation}
        disabled={loading}
        style={styles.button}
      />
    </ScrollView>
  );

  const renderCompleted = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Registration Complete!</Text>
      <Text style={styles.stepDescription}>
        Your driver account has been successfully created and verified.
      </Text>
      
      <View style={styles.completionStatus}>
        <Text style={styles.statusText}>✅ Phone Verified</Text>
        <Text style={styles.statusText}>✅ SSN Verified</Text>
        <Text style={styles.statusText}>✅ License Verified</Text>
        <Text style={styles.statusText}>✅ Insurance Verified</Text>
        <Text style={styles.statusText}>✅ Background Check Passed</Text>
        <Text style={styles.statusText}>✅ Profile Created</Text>
      </View>
      
      <LoadingSpinner text="Redirecting to app..." />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.PHONE_VERIFICATION:
        return renderPhoneVerification();
      case STEPS.SSN_VERIFICATION:
        return renderSSNVerification();
      case STEPS.DRIVERS_LICENSE:
        return renderDriversLicense();
      case STEPS.INSURANCE_VERIFICATION:
        return renderInsuranceVerification();
      case STEPS.BACKGROUND_CHECK:
        return renderBackgroundCheck();
      case STEPS.PROFILE_CREATION:
        return renderProfileCreation();
      case STEPS.COMPLETED:
        return renderCompleted();
      default:
        return renderPhoneVerification();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Driver Registration</Text>
            <Text style={styles.subtitle}>Complete verification to start driving</Text>
          </View>

          {renderStepIndicator()}

          {renderCurrentStep()}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {loading && (
            <View style={styles.loadingOverlay}>
              <LoadingSpinner text="Processing..." />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1037',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aeb4cf',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepActive: {
    backgroundColor: '#2196F3',
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepPending: {
    backgroundColor: '#666',
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 10,
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#2196F3',
  },
  stepTextCompleted: {
    color: '#4CAF50',
  },
  stepTextPending: {
    color: '#666',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#aeb4cf',
    marginBottom: 20,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCheckStatus: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  completionStatus: {
    marginVertical: 20,
  },
}); 