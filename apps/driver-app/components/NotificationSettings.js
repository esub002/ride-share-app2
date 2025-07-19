import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const NOTIFICATION_PREFS_KEY = 'driver_notification_prefs';

const DEFAULT_PREFS = {
  ride_requests: true,
  ride_updates: true,
  earnings_updates: true,
  safety_alerts: true,
  system_announcements: true,
};

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch (e) {
      // ignore, use defaults
    } finally {
      setLoading(false);
    }
  };

  const savePrefs = async (newPrefs) => {
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
    } catch (e) {
      Alert.alert('Error', 'Could not save notification preferences.');
    }
  };

  const handleToggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    savePrefs(updated);
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Notification Preferences</Text>
      {Object.entries(DEFAULT_PREFS).map(([key, _]) => (
        <View key={key} style={styles.row}>
          <Ionicons name={iconForType(key)} size={24} color="#2196F3" style={styles.icon} />
          <Text style={styles.label}>{labelForType(key)}</Text>
          <Switch
            value={prefs[key]}
            onValueChange={() => handleToggle(key)}
          />
        </View>
      ))}
      <Text style={styles.note}>These settings control which notifications you receive on this device.</Text>
    </ScrollView>
  );
}

function labelForType(key) {
  switch (key) {
    case 'ride_requests': return 'Ride Requests';
    case 'ride_updates': return 'Ride Updates';
    case 'earnings_updates': return 'Earnings Updates';
    case 'safety_alerts': return 'Safety Alerts';
    case 'system_announcements': return 'System Announcements';
    default: return key;
  }
}

function iconForType(key) {
  switch (key) {
    case 'ride_requests': return 'car-sport-outline';
    case 'ride_updates': return 'swap-vertical-outline';
    case 'earnings_updates': return 'cash-outline';
    case 'safety_alerts': return 'shield-checkmark-outline';
    case 'system_announcements': return 'megaphone-outline';
    default: return 'notifications-outline';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  note: {
    marginTop: 24,
    color: '#888',
    fontSize: 13,
  },
}); 