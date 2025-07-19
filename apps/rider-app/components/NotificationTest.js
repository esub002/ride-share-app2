import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// Test mode - set to true to skip backend requests
const TEST_MODE = true;

export default function NotificationTest() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [deviceToken, setDeviceToken] = useState('');
  const [testMessage, setTestMessage] = useState('Test notification from RideShare!');
  const [notificationSettings, setNotificationSettings] = useState({
    ride_requests: true,
    ride_updates: true,
    earnings_updates: true,
    safety_alerts: true,
    system_announcements: true,
  });

  useEffect(() => {
    initializeNotifications();
    fetchNotificationHistory();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications to test this feature.');
        return;
      }

      // Get device token
      const token = await Notifications.getExpoPushTokenAsync();
      setDeviceToken(token.data);
      console.log('Device token:', token.data);

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

    } catch (error) {
      console.error('Error initializing notifications:', error);
      Alert.alert('Error', 'Failed to initialize notifications');
    }
  };

  const fetchNotificationHistory = async () => {
    setLoading(true);
    try {
      // For testing, we'll use mock data
      setNotifications([
        {
          id: 1,
          title: '🚗 Ride Request Accepted',
          body: 'Your ride request has been accepted by John Driver',
          sent_at: new Date().toISOString(),
          read_at: null,
        },
        {
          id: 2,
          title: '📍 Driver Arrived',
          body: 'Your driver has arrived at the pickup location',
          sent_at: new Date(Date.now() - 3600000).toISOString(),
          read_at: new Date().toISOString(),
        },
        {
          id: 3,
          title: '✅ Ride Completed',
          body: 'Your ride has been completed. Rate your experience!',
          sent_at: new Date(Date.now() - 7200000).toISOString(),
          read_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.log('Error fetching notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testRegisterDevice = async () => {
    if (!deviceToken) {
      Alert.alert('No Device Token', 'Please wait for device token to be generated');
      return;
    }

    setLoading(true);
    try {
      if (TEST_MODE) {
        // Mock successful registration in test mode
        console.log('Test mode: Registering device token:', deviceToken);
        Alert.alert('Success (Test Mode)', 'Device token registered successfully in test mode!');
        return;
      }

      const response = await fetch('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: deviceToken,
          platform: 'android',
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Device token registered successfully!');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Status: ${response.status}\nMessage: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSendNotification = async () => {
    setLoading(true);
    try {
      if (TEST_MODE) {
        // Mock successful notification in test mode
        console.log('Test mode: Sending notification:', testMessage);
        Alert.alert('Success (Test Mode)', `Notification sent successfully in test mode!\nMessage: ${testMessage}`);
        return;
      }

      const response = await fetch('http://localhost:3000/api/notifications/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [1],
          userType: 'rider',
          title: '🧪 Test Notification',
          body: testMessage,
          data: {
            type: 'test_notification',
            timestamp: Date.now().toString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', `Notification sent!\nResult: ${JSON.stringify(data.result)}`);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Status: ${response.status}\nMessage: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testRideStatusNotification = async () => {
    setLoading(true);
    try {
      if (TEST_MODE) {
        // Mock successful ride status notification in test mode
        console.log('Test mode: Sending ride status notification');
        Alert.alert('Success (Test Mode)', 'Ride status notification sent successfully in test mode!');
        return;
      }

      const response = await fetch('http://localhost:3000/api/notifications/ride-status', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riderId: 1,
          rideData: {
            id: 123,
            status: 'driver_arrived',
            driverName: 'John Driver',
            estimatedArrival: '2 minutes',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', `Ride status notification sent!\n${data.message}`);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Status: ${response.status}\nMessage: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testLocalNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Local Test Notification',
          body: testMessage,
          data: { type: 'local_test' },
        },
        trigger: { seconds: 2 },
      });
      Alert.alert('Success', 'Local notification scheduled! You should see it in 2 seconds.');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule local notification');
    }
  };

  const toggleNotificationSetting = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const renderNotification = (notification) => (
    <View key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationTime}>
          {new Date(notification.sent_at).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.notificationBody}>{notification.body}</Text>
      {notification.read_at && (
        <Text style={styles.readStatus}>✓ Read</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Notification Test</Text>
        <Text style={styles.subtitle}>Test Firebase notifications for riders</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Device Token</Text>
        <Text style={styles.tokenText}>
          {deviceToken ? deviceToken.substring(0, 50) + '...' : 'Generating...'}
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={testRegisterDevice}
          disabled={loading || !deviceToken}
        >
          <Text style={styles.buttonText}>Register Device Token</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Send Test Notifications</Text>
        <TextInput
          style={styles.input}
          value={testMessage}
          onChangeText={setTestMessage}
          placeholder="Enter test message"
          multiline
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={testSendNotification}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Send to Backend</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testLocalNotification}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Send Local Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 Ride Notifications</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={testRideStatusNotification}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Ride Status Update</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Notification Settings</Text>
        {Object.entries(notificationSettings).map(([key, value]) => (
          <View key={key} style={styles.settingRow}>
            <Text style={styles.settingText}>{key.replace('_', ' ').toUpperCase()}</Text>
            <Switch
              value={value}
              onValueChange={() => toggleNotificationSetting(key)}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Notification History</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          notifications.map(renderNotification)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  readStatus: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 5,
  },
}); 