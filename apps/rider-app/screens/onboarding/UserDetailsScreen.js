import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import Button from '../../components/ui/Button';

export default function UserDetailsScreen({ navigation, route }) {
  const { phoneNumber, countryCode, socialProvider } = route.params || {};
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(phoneNumber || '');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter both first name and last name');
      return;
    }

    if (!phone.trim() && !socialProvider) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    setLoading(true);
    try {
      // Optionally update registration with name/email if needed
      // await apiPost('/api/auth/register', { phone, name: `${firstName} ${lastName}` });
      setLoading(false);
      navigation.navigate('OtpVerification', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        countryCode,
        socialProvider,
      });
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to continue.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={[Colors.gradientTop, Colors.primary, Colors.gradientBottom, Colors.accent]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>We'll use this information to personalize your experience</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputBlockShadow}>
            <View style={styles.inputBlockCard}>
              {/* First Name */}
              <View style={styles.inputRowRedesigned}>
                <Ionicons name="person-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputRedesigned}
                  placeholder="First Name"
                  placeholderTextColor="#72809b"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputRowRedesigned}>
                <Ionicons name="person-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputRedesigned}
                  placeholder="Last Name"
                  placeholderTextColor="#72809b"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Phone Number (only show if not from social login) */}
              {!socialProvider && (
                <View style={styles.inputRowRedesigned}>
                  <Ionicons name="call-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.inputRedesigned}
                    placeholder="Phone Number"
                    placeholderTextColor="#72809b"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              )}

              {/* Social Provider Info (if from social login) */}
              {socialProvider && (
                <View style={styles.socialInfo}>
                  <Ionicons 
                    name={socialProvider === 'Google' ? 'logo-google' : 
                          socialProvider === 'Apple' ? 'logo-apple' : 'mail-outline'} 
                    size={22} 
                    color="#aeb4cf" 
                    style={{ marginRight: 10 }} 
                  />
                  <Text style={styles.socialInfoText}>
                    Connected via {socialProvider}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Button
            title={loading ? 'Processing...' : 'Continue'}
            icon="arrow-forward"
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim() || (!phone.trim() && !socialProvider) || loading}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>Your data is secure</Text>
            <Text style={styles.infoText}>
              We use industry-standard encryption to protect your personal information
            </Text>
          </View>
        </View>
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
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 8,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  inputSection: {
    marginBottom: 32,
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
  socialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 0,
  },
  socialInfoText: {
    fontSize: 16,
    color: '#aeb4cf',
    fontFamily: Typography.fontFamily,
  },
  continueButton: {
    marginTop: 8,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoCard: {
    backgroundColor: '#0c1037',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 