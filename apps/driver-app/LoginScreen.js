import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { app, auth } from "./firebase";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing, BorderRadius, Shadows } from './constants/Spacing';

export default function LoginScreen({ navigation, onLogin }) {
  const recaptchaVerifier = useRef(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation helpers
  const isPhoneValid = () => phone.length >= 10 && phone.length <= 15 && phone.match(/^\+?\d+$/);
  const isOTPValid = () => otp.length === 6 && otp.match(/^\d+$/);

  // Send OTP via Firebase
  const sendOTP = async () => {
    setLoading(true);
    setMessage("");
    try {
      console.log('Attempting to send OTP to:', phone);
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        phone,
        recaptchaVerifier.current
      );
      console.log('OTP verificationId received:', id);
      setVerificationId(id);
      setMessage("OTP sent!");
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.log('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP via Firebase
  const verifyOTP = async () => {
    setLoading(true);
    setMessage("");
    try {
      console.log('Verifying OTP:', otp, 'with verificationId:', verificationId);
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      setMessage("Phone authentication successful!");
      console.log('Phone authentication successful:', result.user);
      // TODO: Call your backend here with result.user.uid and phone
      if (onLogin) onLogin(result.user);
    } catch (err) {
      setMessage(`Invalid OTP: ${err.message}`);
      console.log('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Allow user to go back to phone input
  const handleBack = () => {
    setVerificationId(null);
    setOtp("");
    setMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        bounces={false}
        nestedScrollEnabled={true}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="car" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.appTitle}>Driver App</Text>
          <Text style={styles.appSubtitle}>Professional ride-sharing platform</Text>
        </View>

        {/* Status Card */}
        <Card
          variant="outlined"
          size="small"
          style={styles.statusCard}
          leftIcon="checkmark-circle"
        >
          <Text style={styles.statusText}>
            🔗 Connected to Backend API{"\n"}
            📱 Login via mobile number and OTP{"\n"}
            🧪 Test OTP: <Text style={styles.highlightText}>123456</Text>{"\n"}
            📱 Platform: {Platform.OS} | Version: {Platform.Version}
          </Text>
        </Card>

        {/* Main Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back!</Text>

          <FirebaseRecaptchaVerifierModal
            ref={recaptchaVerifier}
            firebaseConfig={app.options}
          />

          {/* Phone Input */}
          {!verificationId && (
            <>
              <TextInput
                placeholder="Enter phone number (e.g. +11234567890)"
                onChangeText={setPhone}
                keyboardType="phone-pad"
                value={phone}
                style={styles.input}
                editable={!verificationId && !loading}
                autoFocus={true}
                maxLength={15}
              />
              <Button
                title="Send OTP"
                onPress={sendOTP}
                loading={loading}
                disabled={!isPhoneValid() || !!verificationId || loading}
                style={styles.submitButton}
              />
            </>
          )}

          {/* OTP Input */}
          {verificationId && (
            <>
              <TextInput
                placeholder="Enter 6-digit OTP"
                onChangeText={setOtp}
                keyboardType="number-pad"
                value={otp}
                style={styles.input}
                editable={!loading}
                maxLength={6}
              />
              <Button
                title="Verify OTP"
                onPress={verifyOTP}
                loading={loading}
                disabled={!isOTPValid() || loading}
                style={styles.submitButton}
              />
              <Button
                title="Back"
                onPress={handleBack}
                style={styles.submitButton}
                variant="ghost"
              />
            </>
          )}

          {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
          {!!message && (
            <Text style={{ color: message.startsWith('Error') || message.startsWith('Invalid') ? 'red' : 'green', marginTop: 10 }}>{message}</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure • Fast • Reliable</Text>
        </View>
        <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  appTitle: {
    ...Typography.h1,
    color: Colors.light.text,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  appSubtitle: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: Spacing.xl,
  },
  statusText: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  formCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  formTitle: {
    ...Typography.h2,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    fontSize: 16,
    backgroundColor: Colors.light.surfaceSecondary,
    color: Colors.light.text,
  },
  submitButton: {
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  signupButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});
  
