import React, { useState, useEffect, useCallback, useMemo, useRef, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, Platform, ToastAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import components
import DrawerContent from './DrawerContent';
import Wallet from './components/Wallet';
import Profile from './components/Profile';
import TripHistory from './components/TripHistory';
import CustomerCommunication from './components/CustomerCommunication';
import SafetyFeatures from './components/SafetyFeatures';
import Settings from './components/Settings';
import Theme from './components/Theme';
import DriverHome from './DriverHome';
import RideManagement from './components/RideManagement';
import EarningsFinance from './components/EarningsFinance';
import SafetyCommunication from './components/SafetyCommunication';
import NotificationService from './utils/notifications';
import VoiceCommands from './components/VoiceCommands';
import AdvancedSafety from './components/AdvancedSafety';
import DriverAnalytics from './components/DriverAnalytics';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import LoadingSpinner from './components/ui/LoadingSpinner';
import offlineManager from './utils/offlineManager';
import performanceOptimizer from './utils/performanceOptimizer';
import apiService from './utils/api';
import LoginScreen from './LoginScreen';
import EnhancedNavigationScreen from './screens/EnhancedNavigationScreen';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing } from './constants/Spacing';
import NotificationTest from './components/NotificationTest';
import NotificationSettings from './components/NotificationSettings';
import SignupScreen from './screens/SignupScreen';
import VerificationScreen from './screens/VerificationScreen';
import DrawerNavigator from './navigation/DrawerNavigator';
import VerificationStack from './navigation/VerificationStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './auth/AuthContext';

export const ErrorContext = createContext({ setError: () => {} });
export const LoadingContext = createContext({ setLoading: () => {}, loading: false });

function GlobalErrorHandler({ children }) {
  const [error, setError] = useState(null);
  const timeoutRef = useRef();

  useEffect(() => {
    if (error) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(error, ToastAndroid.LONG);
      } else {
        Alert.alert('Error', error);
      }
      timeoutRef.current = setTimeout(() => setError(null), 4000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [error]);

  return (
    <ErrorContext.Provider value={{ setError }}>
      {children}
    </ErrorContext.Provider>
  );
}

function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)' }}>
          <LoadingSpinner type="pulse" text="Loading..." color="#2196F3" size="large" />
        </View>
      )}
    </LoadingContext.Provider>
  );
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!offlineManager.isDeviceOnline());
  useEffect(() => {
    const unsubscribe = offlineManager.addListener(({ isOnline }) => {
      setIsOffline(!isOnline);
    });
    return () => unsubscribe && unsubscribe();
  }, []);
  if (!isOffline) return null;
  return (
    <View style={{ backgroundColor: '#FBC02D', padding: 8, alignItems: 'center' }}>
      <Text style={{ color: '#333', fontWeight: 'bold' }}>You are offline. Some features may not work.</Text>
    </View>
  );
}

function SocketStatusBanner() {
  const [connected, setConnected] = useState(apiService.socket?.connected || false);
  useEffect(() => {
    if (!apiService.socket) return;
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    apiService.socket.on('connect', handleConnect);
    apiService.socket.on('disconnect', handleDisconnect);
    return () => {
      apiService.socket.off('connect', handleConnect);
      apiService.socket.off('disconnect', handleDisconnect);
    };
  }, [apiService.socket]);
  if (connected) return null;
  return (
    <View style={{ backgroundColor: '#D32F2F', padding: 8, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Disconnected from server. Trying to reconnect...</Text>
    </View>
  );
}

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Component wrappers to fix navigation issues
const DriverHomeWrapper = (props) => <DriverHome {...props} user={global.user} token={global.token} />;
const RideManagementWrapper = (props) => <RideManagement {...props} user={global.user} token={global.token} />;
const EarningsFinanceWrapper = (props) => <EarningsFinance {...props} user={global.user} token={global.token} />;
const SafetyCommunicationWrapper = (props) => <SafetyCommunication {...props} user={global.user} token={global.token} />;
const VoiceCommandsWrapper = (props) => <VoiceCommands {...props} user={global.user} token={global.token} />;
const AdvancedSafetyWrapper = (props) => <AdvancedSafety {...props} user={global.user} token={global.token} />;
const DriverAnalyticsWrapper = (props) => <DriverAnalytics {...props} user={global.user} token={global.token} />;

// Create a wrapper that provides the onLogin function
const createLoginScreenWrapper = (onLogin) => {
  return React.memo(() => <LoginScreen onLogin={onLogin} />);
};

// Stack Navigator for main app screens
function MainAppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DrawerHome" component={MainApp} />
      <Stack.Screen 
        name="EnhancedNavigation" 
        component={EnhancedNavigationScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Verification" 
        component={VerificationScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize offline manager listener
    const unsubscribe = offlineManager.addListener(({ isOnline }) => {
      setIsOnline(isOnline);
    });

    // Simulate app initialization
    const initApp = async () => {
      try {
        // Initialize notification service
        await NotificationService.init();
        
        // Initialize offline manager
        await offlineManager.init();
        
        // Initialize API service
        await apiService.init();
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };

    initApp();

    return () => {
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="bounce" 
          text="Initializing..." 
          color={Colors.light.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <SocketStatusBanner />
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: Colors.light.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerStyle: {
            backgroundColor: Colors.light.background,
          },
          drawerActiveTintColor: Colors.light.primary,
          drawerInactiveTintColor: Colors.light.textSecondary,
        }}
      >
        <Drawer.Screen 
          name="Home" 
          component={DriverHomeWrapper} 
          options={{
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="RideManagement" 
          component={RideManagementWrapper} 
          options={{
            title: 'Ride Management',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="car" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="EarningsFinance" 
          component={EarningsFinanceWrapper} 
          options={{
            title: 'Earnings & Finance',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cash" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="SafetyCommunication" 
          component={SafetyCommunicationWrapper} 
          options={{
            title: 'Safety & Communication',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="VoiceCommands" 
          component={VoiceCommandsWrapper} 
          options={{
            title: 'Voice Commands',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="mic" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="AdvancedSafety" 
          component={AdvancedSafetyWrapper} 
          options={{
            title: 'Advanced Safety',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="DriverAnalytics" 
          component={DriverAnalyticsWrapper} 
          options={{
            title: 'Analytics',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="analytics" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Wallet" 
          component={Wallet} 
          options={{
            title: 'Wallet',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Profile" 
          component={Profile} 
          options={{
            title: 'Profile',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="TripHistory" 
          component={TripHistory} 
          options={{
            title: 'Trip History',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="time" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="CustomerCommunication" 
          component={CustomerCommunication} 
          options={{
            title: 'Customer Communication',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="SafetyFeatures" 
          component={SafetyFeatures} 
          options={{
            title: 'Safety Features',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="warning" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={Settings} 
          options={{
            title: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Theme" 
          component={Theme} 
          options={{
            title: 'Theme',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="color-palette" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="NotificationTest" 
          component={NotificationTest} 
          options={{
            title: 'Notification Test',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="notifications" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="NotificationSettings" 
          component={NotificationSettings} 
          options={{
            title: 'Notification Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="notifications" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Verification" 
          component={VerificationScreen} 
          options={{
            title: 'Verification',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </SafeAreaView>
  );
}

function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userValid, setUserValid] = useState(true);
  const [showLoginFallback, setShowLoginFallback] = useState(false);
  const navigationRef = useRef();

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (navigationRef.current) {
      NotificationService.setNavigationRef(navigationRef.current);
    }
  }, [navigationRef.current]);

  // Add fallback timer for when user is not valid
  useEffect(() => {
    if (!userValid && !isLoading) {
      const timer = setTimeout(() => {
        setShowLoginFallback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userValid, isLoading]);

  const checkAuthentication = async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), 10000)
      );
      
      const authPromise = (async () => {
        await apiService.init();
        const status = apiService.getStatus();
        console.log('📊 API Status:', status);
        
        if (status.hasToken) {
          try {
            console.log('🔑 Token found, fetching profile...');
            const profile = await apiService.getDriverProfile();
            console.log('✅ Profile fetched:', profile);
            global.user = profile;
            global.token = apiService.token;
            setIsAuthenticated(true);
            setUserValid(profile && profile.id);
          } catch (error) {
            console.log('❌ Profile fetch failed:', error);
            // Clear invalid token and continue to login
            apiService.clearToken();
            setIsAuthenticated(false);
            setUserValid(false);
          }
        } else {
          console.log('🔑 No token found, proceeding to login');
          setIsAuthenticated(false);
          setUserValid(false);
        }
      })();
      
      await Promise.race([authPromise, timeoutPromise]);
      
    } catch (error) {
      console.log('❌ Authentication check failed:', error);
      // If backend is not available, still allow app to function
      setIsAuthenticated(false);
      setUserValid(false);
    } finally {
      console.log('🏁 Authentication check complete');
      setIsLoading(false);
    }
  };

  const handleLogin = (token, userProfile) => {
    console.log('🔐 Login successful:', { token: !!token, userProfile });
    global.user = userProfile;
    global.token = token;
    setIsAuthenticated(true);
    setUserValid(userProfile && userProfile.id);
    const pushToken = NotificationService.getPushToken && NotificationService.getPushToken();
    if (pushToken && userProfile && userProfile.id) {
      NotificationService.registerPushToken(userProfile.id, pushToken);
    }
  };

  const handleLogout = () => {
    apiService.clearToken();
    global.user = null;
    global.token = null;
    setIsAuthenticated(false);
    setUserValid(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="bounce" 
          text="Checking Authentication..." 
          color={Colors.light.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  // If user is not valid but we're not loading, show loading briefly then proceed
  if (!userValid && !isLoading && !showLoginFallback) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="bounce" 
          text="Loading profile..." 
          color={Colors.light.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <OfflineBanner />
      <SocketStatusBanner />
      {isAuthenticated ? (
        <DrawerNavigator />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <GlobalErrorHandler>
          <LoadingProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </LoadingProvider>
        </GlobalErrorHandler>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
