import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Alert from './utils/alertPolyfill';
import HomeScreen from './screens/HomeScreen';
import RideHistoryScreen from './screens/RideHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RideRequestScreen from './screens/RideRequestScreen';
import RideStatusScreen from './screens/RideStatusScreen';
import WalletScreen from './screens/WalletScreen';
import ChatScreen from './screens/ChatScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import RideDNA from './screens/RideDNA';
import NotificationTest from './components/NotificationTest';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PaymentsScreen from './screens/PaymentsScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SupportScreen from './screens/SupportScreen';
import SettingsScreen from './screens/SettingsScreen';
import ScheduleRideScreen from './screens/ScheduleRideScreen';
import RideTypeSelectionScreen from './screens/RideTypeSelectionScreen';
import PaymentScreen from './screens/PaymentScreen';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

// Import onboarding screens
import PhoneEntryScreen from './screens/onboarding/PhoneEntryScreen';
import UserDetailsScreen from './screens/onboarding/UserDetailsScreen';
import OtpVerificationScreen from './screens/onboarding/OtpVerificationScreen';
import TermsScreen from './screens/onboarding/TermsScreen';
import OnboardingTrustedContactScreen from './screens/onboarding/OnboardingTrustedContactScreen';

// Import welcome screen
import WelcomeScreen from './screens/WelcomeScreen';
import TrustedContactsScreen from './screens/TrustedContactsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'RideHistory') iconName = 'time';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="RideHistory" component={RideHistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="OnboardingTrustedContact" component={OnboardingTrustedContactScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { token, hasSeenWelcome, onboardingCompleted } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RideRequest" component={RideRequestScreen} />
            <Stack.Screen name="RideStatus" component={RideStatusScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Chatbot" component={ChatbotScreen} />
            <Stack.Screen name="RideDNA" component={RideDNA} />
            <Stack.Screen name="NotificationTest" component={NotificationTest} />
            <Stack.Screen name="ScheduleRide" component={ScheduleRideScreen} />
            <Stack.Screen name="RideTypeSelection" component={RideTypeSelectionScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="TrustedContacts" component={TrustedContactsScreen} />
          </>
        ) : onboardingCompleted && !hasSeenWelcome ? (
          <>
            {/* Show welcome screen after onboarding is completed */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingStack} />
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        ) : (
          <>
            {/* Show onboarding flow first for new users */}
            <Stack.Screen name="Onboarding" component={OnboardingStack} />
            <Stack.Screen name="Auth" component={AuthStack} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  React.useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
