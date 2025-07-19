import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, loading: authLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      navigation.replace('MainTabs');
    } else if (error) {
      Alert.alert('Login Failed', error);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Login',
      'You can skip login for testing, but some features will be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: async () => {
            // For testing purposes only - actually log in with test credentials
            console.log('Skipping login for testing');
            setLoading(true);
            const success = await login('test@example.com', 'testpassword');
            setLoading(false);
            if (success) {
              navigation.replace('MainTabs');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Ionicons name="car" size={48} color={Colors.primary} style={{ alignSelf: 'center' }} />
      <Text style={styles.header}>Sign In</Text>
      <View style={styles.inputBlockShadow}>
        <View style={styles.inputBlockCard}>
          <View style={styles.inputRowRedesigned}>
            <Ionicons name="mail-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.inputRedesigned}
              placeholder="Email"
              placeholderTextColor="#72809b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputRowRedesigned}>
            <Ionicons name="lock-closed-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.inputRedesigned}
              placeholder="Password"
              placeholderTextColor="#72809b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>
      </View>
      <Button title={loading || authLoading ? "Signing In..." : "Sign In"} icon="log-in" style={styles.signInBtn} onPress={handleLogin} disabled={loading || authLoading} />
      {(loading || authLoading) && <ActivityIndicator style={{ marginTop: 10 }} color={Colors.primary} />}
      <TouchableOpacity style={styles.link} onPress={() => navigation.replace('Register')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.link, { marginTop: 16 }]} onPress={handleSkip}>
        <Text style={[styles.linkText, { color: 'gray' }]}>Skip Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
    justifyContent: 'center',
  },
  header: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: Spacing.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  signInBtn: {
    marginTop: Spacing.lg,
  },
  link: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  inputBlockShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
    marginBottom: 18,
  },
  inputBlockCard: {
    backgroundColor: '#0c1037',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', // subtle border
  },
  inputRowRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 0,
  },
  inputRedesigned: {
    flex: 1,
    fontSize: 16,
    color: '#aeb4cf',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    fontFamily: Typography.fontFamily,
  },
}); 