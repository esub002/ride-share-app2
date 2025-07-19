import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import apiService from '../utils/api';

export default function SignupScreen({ navigation, onLogin }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [car, setCar] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: form, 2: otp
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !phone || !car || !password) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      // Send registration data to backend
      await apiService.request('/auth/driver/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          car,
          password,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      setStep(2);
      Alert.alert('OTP Sent', 'Please enter the OTP sent to your phone.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      // Verify OTP and login
      const result = await apiService.request('/auth/driver/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (result.token && result.driver) {
        onLogin(result.token, result.driver);
      } else {
        throw new Error('Invalid OTP or registration failed.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 ? (
        <>
          <Text style={styles.header}>Sign Up</Text>
          <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Car Info" value={car} onChangeText={setCar} />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Sign Up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchButton} onPress={() => navigation.goBack()}>
            <Text style={styles.switchText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.header}>Verify OTP</Text>
          <TextInput style={styles.input} placeholder="Enter OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#2196F3',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchButton: {
    marginTop: 8,
  },
  switchText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
}); 