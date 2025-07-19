import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>This is the Settings screen. Implement app settings here.</Text>
      {/* Safety & Privacy Section */}
      <View style={{ marginTop: 32, width: '90%' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Safety & Privacy</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
          onPress={() => navigation.navigate('TrustedContacts')}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#3a74e5" style={{ marginRight: 12 }} />
          <Text style={{ fontSize: 16, color: '#222', flex: 1 }}>Trusted Contacts</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 24,
  },
}); 