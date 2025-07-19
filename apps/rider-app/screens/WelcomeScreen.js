import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import Button from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { markWelcomeSeen } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animations for a smooth entrance
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(animations).start();

    // Icon floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = async () => {
    // Mark welcome screen as seen and complete the login process
    await markWelcomeSeen();
    // The navigation will automatically update when the token is set
    // No need to manually navigate - the App.js logic will handle it
  };

  const iconTranslateY = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const buttonScale = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <LinearGradient
      colors={[Colors.gradientTop, Colors.primary, Colors.gradientBottom, Colors.accent]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Radial Glow Effect */}
      <LinearGradient
        colors={['rgba(58,116,229,0.3)', 'rgba(12,16,55,0.0)']}
        style={styles.radialGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.content}>
        {/* App Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: iconTranslateY },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.iconBackground}
          >
            <Ionicons name="car-sport" size={80} color="#ffffff" />
          </LinearGradient>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.welcomeTitle}>Welcome to</Text>
          <Text style={styles.appName}>RideShare</Text>
          <Text style={styles.subtitle}>
            Your account is ready! Let's start your premium ride-sharing experience
          </Text>
        </Animated.View>

        {/* Features List */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color="#4CD964" />
            <Text style={styles.featureText}>Safe & Secure Rides</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={24} color="#FFD600" />
            <Text style={styles.featureText}>Lightning Fast Pickup</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="star" size={24} color="#FF9500" />
            <Text style={styles.featureText}>Premium Experience</Text>
          </View>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: buttonScale },
              ],
            },
          ]}
        >
          <Button
            title="Start Riding"
            icon="car-sport"
            iconRight
            style={styles.getStartedButton}
            textStyle={styles.buttonText}
            onPress={handleGetStarted}
          />
        </Animated.View>

        {/* Bottom Text */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.bottomText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  radialGlow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    height: 400,
    borderRadius: 200,
    zIndex: 0,
    transform: [{ scaleX: 1.5 }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 32,
    paddingBottom: 32,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 24,
    color: '#aeb4cf',
    fontFamily: Typography.fontFamily,
    marginBottom: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#aeb4cf',
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
    lineHeight: 26,
    maxWidth: width * 0.8,
  },
  featuresContainer: {
    marginBottom: 48,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#aeb4cf',
    marginLeft: 16,
    fontFamily: Typography.fontFamily,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  getStartedButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily,
  },
  bottomContainer: {
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 12,
    color: '#72809b',
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
    lineHeight: 18,
    maxWidth: width * 0.8,
  },
}); 