import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Card from '../components/ui/Card';
import { apiRequest } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { viewAllStorage, resetAppToInitialState } from '../utils/clearStorage';

const menu = [
  { label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet' },
  { label: 'Ride DNA', icon: 'analytics-outline', screen: 'RideDNA' },
  { label: 'Payments', icon: 'card-outline', screen: 'Payments' },
  { label: 'Favorites', icon: 'heart-outline', screen: 'Favorites' },
  { label: 'History', icon: 'time-outline', screen: 'RideHistory' },
  { label: 'Support', icon: 'help-circle-outline', screen: 'Support' },
  { label: 'Settings', icon: 'settings-outline', screen: 'Settings' },
];

export default function ProfileScreen() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const navigation = useNavigation();
  const { resetWelcome, resetAllData } = useAuth();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/users/me', { method: 'GET', auth: true });
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      // Try navigating via parent (stack) if available, else fallback
      if (navigation.getParent()) {
        navigation.getParent().navigate(item.screen);
      } else {
        navigation.navigate(item.screen);
      }
    } else {
      Alert.alert(item.label, 'This feature is coming soon!');
    }
  };

  const handleResetWelcome = async () => {
    Alert.alert(
      'Reset Welcome Screen',
      'This will reset the welcome screen so you can see it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Welcome',
          style: 'default',
          onPress: async () => {
            await resetWelcome();
            Alert.alert('Reset Complete', 'Welcome screen has been reset. Please restart the app.');
          }
        }
      ]
    );
  };

  const handleResetAllData = async () => {
    Alert.alert(
      'Reset All App Data',
      'This will completely reset the app to its initial state. All data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All Data',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Reset Complete', 'All app data has been cleared. Please restart the app to see the welcome screen.');
          }
        }
      ]
    );
  };

  const handleViewStorage = async () => {
    await viewAllStorage();
    Alert.alert('Storage Data', 'Check the console/logs to see all stored data.');
  };

  const handleResetWithUtility = async () => {
    Alert.alert(
      'Reset App (Utility)',
      'This will reset the app using the utility function.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAppToInitialState();
            Alert.alert('Reset Complete', 'App has been reset. Please restart the app.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <View style={styles.profileRow}>
        <Ionicons name="person-circle" size={72} color={Colors.primary} />
        <View style={{ marginLeft: Spacing.md, flexShrink: 1 }}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">Mohit Kumar</Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">mohit@email.com</Text>
          <Text style={styles.rating}>⭐ 4.8</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.menuList}>
        {menu.map((item) => (
          <TouchableOpacity key={item.label} onPress={() => handleMenuPress(item)}>
            <Card style={styles.menuCard} left={<Ionicons name={item.icon} size={22} color={Colors.primary} />}>
              <Text style={styles.menuLabel} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Card>
          </TouchableOpacity>
        ))}
        
        {/* Test buttons for resetting data */}
        <TouchableOpacity onPress={handleResetWelcome}>
          <Card style={[styles.menuCard, { borderColor: Colors.warning, borderWidth: 1 }]} left={<Ionicons name="refresh" size={22} color={Colors.warning} />}>
            <Text style={[styles.menuLabel, { color: Colors.warning }]} numberOfLines={1} ellipsizeMode="tail">Reset Welcome Screen (Test)</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.warning} />
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleResetAllData}>
          <Card style={[styles.menuCard, { borderColor: Colors.error, borderWidth: 1 }]} left={<Ionicons name="trash" size={22} color={Colors.error} />}>
            <Text style={[styles.menuLabel, { color: Colors.error }]} numberOfLines={1} ellipsizeMode="tail">Reset All App Data (Test)</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleViewStorage}>
          <Card style={[styles.menuCard, { borderColor: Colors.primary, borderWidth: 1 }]} left={<Ionicons name="eye" size={22} color={Colors.primary} />}>
            <Text style={[styles.menuLabel, { color: Colors.primary }]} numberOfLines={1} ellipsizeMode="tail">View Storage Data (Debug)</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetWithUtility}>
          <Card style={[styles.menuCard, { borderColor: Colors.accent, borderWidth: 1 }]} left={<Ionicons name="refresh-circle" size={22} color={Colors.accent} />}>
            <Text style={[styles.menuLabel, { color: Colors.accent }]} numberOfLines={1} ellipsizeMode="tail">Reset App (Utility)</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
          </Card>
        </TouchableOpacity>
      </View>
      <Text style={styles.appInfo}>Rider App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 32,
  },
  header: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  name: {
    ...Typography.h3,
    color: Colors.text,
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rating: {
    color: Colors.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  editBtn: {
    marginLeft: 'auto',
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    padding: 8,
  },
  menuList: {
    marginTop: Spacing.lg,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 12,
  },
  menuLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  appInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
}); 