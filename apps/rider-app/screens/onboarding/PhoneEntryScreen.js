import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import { useAuth } from '../../auth/AuthContext';

// Mock country data - in production, use a proper country picker library
const countries = [
  { code: '+1', name: 'US', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+91', name: 'IN', flag: '🇮🇳' },
  { code: '+86', name: 'CN', flag: '🇨🇳' },
  { code: '+81', name: 'JP', flag: '🇯🇵' },
  { code: '+49', name: 'DE', flag: '🇩🇪' },
  { code: '+33', name: 'FR', flag: '🇫🇷' },
  { code: '+39', name: 'IT', flag: '🇮🇹' },
  { code: '+34', name: 'ES', flag: '🇪🇸' },
  { code: '+31', name: 'NL', flag: '🇳🇱' },
];

export default function PhoneEntryScreen({ navigation }) {
  const { skipOnboarding } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleContinue = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    
    // Store phone data and navigate to next screen
    navigation.navigate('UserDetails', {
      phoneNumber: selectedCountry.code + phoneNumber,
      countryCode: selectedCountry.code,
    });
  };

  const handleSocialLogin = (provider) => {
    Alert.alert(
      `${provider} Login`,
      `${provider} login will be implemented with proper OAuth integration. For now, this is a mock flow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue Mock', 
          onPress: () => {
            // Mock successful social login
            navigation.navigate('UserDetails', {
              phoneNumber: '',
              countryCode: '',
              socialProvider: provider,
            });
          }
        }
      ]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Onboarding',
      'You can skip the onboarding for testing purposes. This will take you directly to the main app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: async () => {
            // Use the AuthContext method to skip onboarding
            const success = await skipOnboarding();
            if (!success) {
              Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
            }
          }
        }
      ]
    );
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
          <Text style={styles.title}>Welcome to RideShare</Text>
          <Text style={styles.subtitle}>Enter your phone number to get started</Text>
        </View>

        {/* Phone Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputBlockShadow}>
            <View style={styles.inputBlockCard}>
              {/* Country Code Picker */}
              <TouchableOpacity
                style={styles.countryPicker}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
              >
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Ionicons 
                  name={showCountryPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#aeb4cf" 
                />
              </TouchableOpacity>

              {/* Country Dropdown */}
              {showCountryPicker && (
                <View style={styles.countryDropdown}>
                  <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={country.code}
                        style={styles.countryItem}
                        onPress={() => {
                          setSelectedCountry(country);
                          setShowCountryPicker(false);
                        }}
                      >
                        <Text style={styles.flagText}>{country.flag}</Text>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.countryCode}>{country.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Phone Number Input */}
              <View style={styles.inputRowRedesigned}>
                <Ionicons name="call-outline" size={22} color="#aeb4cf" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputRedesigned}
                  placeholder="Enter phone number"
                  placeholderTextColor="#72809b"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>
          </View>

          <Button
            title="Continue with Phone"
            icon="arrow-forward"
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={!phoneNumber.trim()}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Options */}
        <View style={styles.socialSection}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Google')}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Apple')}
          >
            <Ionicons name="logo-apple" size={24} color="#000000" />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Email')}
          >
            <Ionicons name="mail-outline" size={24} color="#aeb4cf" />
            <Text style={styles.socialButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button for Testing */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip Sign In (Testing)</Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
  },
  flagText: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: '#aeb4cf',
    fontWeight: '600',
    flex: 1,
  },
  countryDropdown: {
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    marginBottom: 14,
    maxHeight: 200,
  },
  countryList: {
    paddingHorizontal: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  countryName: {
    fontSize: 16,
    color: '#aeb4cf',
    flex: 1,
    marginLeft: 8,
  },
  inputRowRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
  continueButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: 16,
  },
  socialSection: {
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialButtonText: {
    ...Typography.bodyBold,
    color: '#aeb4cf',
    marginLeft: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
}); 