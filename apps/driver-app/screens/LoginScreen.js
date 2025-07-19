import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        // Navigate to profile for verification
        navigation.replace('DriverHome');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    }
  };

  const handleQuickLogin = () => {
    // For demo purposes, allow quick login
    setEmail('driver@example.com');
    setPassword('password123');
    setTimeout(() => {
      login('driver@example.com', 'password123');
      navigation.replace('DriverHome');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Login</Text>
          <Text style={styles.subtitle}>Sign in to your driver account</Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            style={styles.loginButton}
          />

          <Button
            title="Quick Demo Login"
            onPress={handleQuickLogin}
            variant="secondary"
            style={styles.demoButton}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account? Contact support to register.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1037',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aeb4cf',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    marginTop: 10,
  },
  demoButton: {
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#72809b',
    textAlign: 'center',
  },
});
