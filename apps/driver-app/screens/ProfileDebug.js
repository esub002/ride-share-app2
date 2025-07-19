import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function ProfileDebug() {
  try {
    const auth = useAuth();
    const user = auth?.user || { firstName: 'Demo', lastName: 'User' };
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile Debug</Text>
          <Text style={styles.subtitle}>Testing AuthContext</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Auth Context Status:</Text>
            <Text style={styles.infoText}>Auth exists: {auth ? 'Yes' : 'No'}</Text>
            <Text style={styles.infoText}>User exists: {user ? 'Yes' : 'No'}</Text>
            <Text style={styles.infoText}>User name: {user?.firstName} {user?.lastName}</Text>
            <Text style={styles.infoText}>User email: {user?.email || 'No email'}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Global User Status:</Text>
            <Text style={styles.infoText}>Global user exists: {global.user ? 'Yes' : 'No'}</Text>
            <Text style={styles.infoText}>Global token exists: {global.token ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  } catch (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile Debug - Error</Text>
          <Text style={styles.errorText}>Error: {error.message}</Text>
          <Text style={styles.errorText}>Stack: {error.stack}</Text>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aeb4cf',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#aeb4cf',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4757',
    marginBottom: 8,
  },
}); 