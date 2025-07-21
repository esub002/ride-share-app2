import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '../../utils/api';

export default function OtpVerificationScreen({ navigation, route }) {
  const { firstName, lastName, phoneNumber, countryCode, socialProvider } = route.params || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
  const inputRefs = useRef([]);

  // Mock OTP for testing
  const MOCK_OTP = '123456';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/api/auth/verify-otp', {
        phone: phoneNumber,
        otp: otpString
      });
      setLoading(false);
      if (res.token) {
        await AsyncStorage.setItem('token', res.token);
        // Optionally store user info as well
        navigation.navigate('Terms', {
          firstName,
          lastName,
          phoneNumber,
          countryCode,
          socialProvider,
        });
      } else {
        Alert.alert('Verification Error', 'No token received.');
      }
    } catch (err) {
      setLoading(false);
      setAttempts(attempts + 1);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      if (attempts >= 2) {
        Alert.alert(
          'Too Many Attempts',
          'You have exceeded the maximum verification attempts. Please try again later.',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Invalid Code', (err.message || 'Incorrect code') + `\n${3 - attempts} attempts remaining.`);
      }
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    
    Alert.alert(
      'Code Resent',
      'A new verification code has been sent to your phone number.',
      [{ text: 'OK' }]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Simple formatting for display
    return phone.length > 4 ? 
      `${phone.slice(0, 4)} *** *** ${phone.slice(-2)}` : 
      phone;
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
          <Text style={styles.title}>Verify your phone</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to {formatPhoneNumber(phoneNumber)}
          </Text>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <View style={styles.inputBlockShadow}>
            <View style={styles.inputBlockCard}>
              <Text style={styles.otpLabel}>Enter verification code</Text>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    selectionColor={Colors.primary}
                  />
                ))}
              </View>

              <Text style={styles.mockOtpText}>
                💡 For testing: Use code <Text style={styles.mockOtpCode}>{MOCK_OTP}</Text>
              </Text>
            </View>
          </View>

          <Button
            title={loading ? "Verifying..." : "Verify Code"}
            icon="checkmark"
            style={styles.verifyButton}
            onPress={handleVerify}
            disabled={otp.join('').length !== 6 || loading}
          />
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={resendTimer > 0}
          >
            <Text style={[
              styles.resendButtonText,
              resendTimer > 0 && styles.resendButtonDisabled
            ]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="lock-closed-outline" size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>Secure verification</Text>
            <Text style={styles.infoText}>
              This code expires in 10 minutes for your security
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
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
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
  otpSection: {
    marginBottom: 32,
  },
  inputBlockShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
    marginBottom: 20,
  },
  inputBlockCard: {
    backgroundColor: '#0c1037',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  otpLabel: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#2a2e3e',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#aeb4cf',
    backgroundColor: '#1c1f65',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#1c1f65',
  },
  mockOtpText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  mockOtpCode: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  verifyButton: {
    marginTop: 8,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendButtonText: {
    ...Typography.bodyBold,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  resendButtonDisabled: {
    color: Colors.textSecondary,
    textDecorationLine: 'none',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 