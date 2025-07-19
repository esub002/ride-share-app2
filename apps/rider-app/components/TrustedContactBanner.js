import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useAuth } from '../auth/AuthContext';

export default function TrustedContactBanner({ onAdd }) {
  const { dismissTrustedContactPrompt } = useAuth();

  return (
    <View style={styles.banner}>
      <Ionicons name="shield-checkmark" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerText}>
          🔒 Add someone you trust — they'll get updates during your rides.
        </Text>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addBtnText}>Add Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={dismissTrustedContactPrompt}>
        <Ionicons name="close" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181c3a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bannerText: {
    ...Typography.body,
    color: Colors.text,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
}); 