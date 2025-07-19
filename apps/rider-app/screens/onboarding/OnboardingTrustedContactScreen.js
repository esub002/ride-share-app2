import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, StatusBar, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';

export default function OnboardingTrustedContactScreen({ navigation }) {
  const { addTrustedContact, dismissTrustedContactPrompt, trustedContacts, removeTrustedContact } = useAuth();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !contact.trim()) {
      Alert.alert('Missing Info', 'Please enter both name and phone/email.');
      return;
    }
    setLoading(true);
    await addTrustedContact({ name: name.trim(), contact: contact.trim() });
    setName('');
    setContact('');
    setLoading(false);
  };

  const handleSkip = async () => {
    await dismissTrustedContactPrompt();
    navigation.replace('Welcome');
  };

  const handleContinue = () => {
    navigation.replace('Welcome');
  };

  const handlePickContact = async () => {
    setContactsLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access contacts was denied.');
      setContactsLoading(false);
      return;
    }
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails] });
    setContactsLoading(false);
    if (data.length === 0) {
      Alert.alert('No Contacts', 'No contacts found on your device.');
      return;
    }
    // Show a simple picker (for now, just pick the first contact)
    // For a real app, use a modal or picker UI
    const pick = data.find(c => (c.phoneNumbers && c.phoneNumbers.length) || (c.emails && c.emails.length));
    if (!pick) {
      Alert.alert('No Valid Contacts', 'No contacts with phone or email found.');
      return;
    }
    let contactValue = '';
    if (pick.phoneNumbers && pick.phoneNumbers.length) {
      contactValue = pick.phoneNumbers[0].number;
    } else if (pick.emails && pick.emails.length) {
      contactValue = pick.emails[0].email;
    }
    await addTrustedContact({ name: pick.name, contact: contactValue });
  };

  const handleRemove = async (index) => {
    await removeTrustedContact(index);
  };

  return (
    <LinearGradient
      colors={[Colors.gradientTop, Colors.primary, Colors.gradientBottom, Colors.accent]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <Ionicons name="shield-checkmark" size={48} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={styles.header}>Want someone to know you're safe while riding?</Text>
        <Text style={styles.subheader}>Add a trusted contact and we'll keep them updated during your rides.</Text>
        <Button
          title={contactsLoading ? 'Loading Contacts...' : 'Add from Contacts'}
          icon="person-add"
          style={styles.addBtn}
          onPress={handlePickContact}
          disabled={contactsLoading}
        />
        <View style={styles.inputBlockShadow}>
          <View style={styles.inputBlockCard}>
            <View style={styles.inputRowRedesigned}>
              <Ionicons name="person-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.inputRedesigned}
                placeholder="Name"
                placeholderTextColor="#72809b"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputRowRedesigned}>
              <Ionicons name="call-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.inputRedesigned}
                placeholder="Phone or Email"
                placeholderTextColor="#72809b"
                value={contact}
                onChangeText={setContact}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>
            <Button
              title={loading ? 'Adding...' : 'Add Manually'}
              icon="add-circle"
              style={styles.addBtn}
              onPress={handleAdd}
              disabled={loading}
            />
          </View>
        </View>
        {/* List of added trusted contacts */}
        {trustedContacts.length > 0 && (
          <View style={styles.contactsListSection}>
            <Text style={styles.contactsListTitle}>Trusted Contacts</Text>
            <FlatList
              data={trustedContacts}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.contactRow}>
                  <Ionicons name="person-circle" size={28} color={Colors.primary} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactValue}>{item.contact}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(index)}>
                    <Ionicons name="remove-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
        <Button
          title="Continue"
          icon="arrow-forward"
          style={styles.addBtn}
          onPress={handleContinue}
        />
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: Spacing.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 32,
    justifyContent: 'center',
  },
  header: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheader: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputBlockShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
    marginBottom: 20,
  },
  inputBlockCard: {
    backgroundColor: '#0c1037',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  addBtn: {
    marginTop: 8,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  contactsListSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  contactsListTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181c3a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  contactName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  contactValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
}); 