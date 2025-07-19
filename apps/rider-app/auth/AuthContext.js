import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [trustedContactPromptDismissed, setTrustedContactPromptDismissed] = useState(false);

  useEffect(() => {
    checkToken();
    loadTrustedContacts();
  }, []);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedOnboarding = await AsyncStorage.getItem('onboardingCompleted');
      const storedWelcome = await AsyncStorage.getItem('hasSeenWelcome');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else if (storedUser) {
        // User exists but no token (onboarding completed but welcome not seen)
        setUser(JSON.parse(storedUser));
      }

      if (storedOnboarding) {
        setOnboardingCompleted(JSON.parse(storedOnboarding));
      }

      if (storedWelcome) {
        setHasSeenWelcome(JSON.parse(storedWelcome));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking token:', error);
      setLoading(false);
    }
  };

  const loadTrustedContacts = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem('trustedContacts');
      const promptDismissed = await AsyncStorage.getItem('trustedContactPromptDismissed');
      if (storedContacts) setTrustedContacts(JSON.parse(storedContacts));
      if (promptDismissed) setTrustedContactPromptDismissed(JSON.parse(promptDismissed));
    } catch (e) {
      // ignore
    }
  };

  const addTrustedContact = async (contact) => {
    const updated = [...trustedContacts, contact];
    setTrustedContacts(updated);
    await AsyncStorage.setItem('trustedContacts', JSON.stringify(updated));
    // If user adds a contact, clear the prompt dismissed flag
    setTrustedContactPromptDismissed(false);
    await AsyncStorage.setItem('trustedContactPromptDismissed', 'false');
  };

  const removeTrustedContact = async (contactIndex) => {
    const updated = trustedContacts.filter((_, i) => i !== contactIndex);
    setTrustedContacts(updated);
    await AsyncStorage.setItem('trustedContacts', JSON.stringify(updated));
  };

  const hasTrustedContact = () => trustedContacts.length > 0;

  const dismissTrustedContactPrompt = async () => {
    setTrustedContactPromptDismissed(true);
    await AsyncStorage.setItem('trustedContactPromptDismissed', 'true');
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response && response.token) {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        
        setToken(response.token);
        setUser(response.user);
        setOnboardingCompleted(true);
        
        return true;
      } else {
        setError('Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });

      if (response && response.token) {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        
        setToken(response.token);
        setUser(response.user);
        setOnboardingCompleted(true);
        
        return true;
      } else {
        setError('Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // New method to complete onboarding and create account
  const completeOnboarding = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      // Simulate API call for account creation
      // In production, this would be a real API call
      const mockResponse = {
        token: 'mock_token_' + Date.now(),
        user: {
          id: Date.now(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          email: userData.email || 'user@rideshare.com',
        }
      };

      // Store the user data but don't set token yet (don't auto-login)
      await AsyncStorage.setItem('user', JSON.stringify(mockResponse.user));
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      // Store token separately for later use
      await AsyncStorage.setItem('pendingToken', mockResponse.token);
      
      setUser(mockResponse.user);
      setOnboardingCompleted(true);
      // Don't set token - user will see welcome screen first
      
      return true;
    } catch (error) {
      console.error('Onboarding completion error:', error);
      setError(error.message || 'Account creation failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Method to skip onboarding for testing
  const skipOnboarding = async () => {
    try {
      const mockToken = 'test_token_' + Date.now();
      const mockUser = {
        id: Date.now(),
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        email: 'test@rideshare.com',
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      await AsyncStorage.setItem('pendingToken', mockToken);
      
      setUser(mockUser);
      setOnboardingCompleted(true);
      // Don't set token - user will see welcome screen first
      
      return true;
    } catch (error) {
      console.error('Skip onboarding error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('onboardingCompleted');
      
      setToken(null);
      setUser(null);
      setOnboardingCompleted(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Method to mark welcome screen as seen and complete login
  const markWelcomeSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setHasSeenWelcome(true);
      
      // Complete the login process by setting the token
      const pendingToken = await AsyncStorage.getItem('pendingToken');
      if (pendingToken) {
        await AsyncStorage.setItem('token', pendingToken);
        await AsyncStorage.removeItem('pendingToken');
        setToken(pendingToken);
      }
    } catch (error) {
      console.error('Error marking welcome as seen:', error);
    }
  };

  // Method to reset welcome screen (for testing)
  const resetWelcome = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenWelcome');
      setHasSeenWelcome(false);
    } catch (error) {
      console.error('Error resetting welcome:', error);
    }
  };

  // Method to completely reset all app data (for testing)
  const resetAllData = async () => {
    try {
      await AsyncStorage.clear(); // This clears ALL AsyncStorage data
      setToken(null);
      setUser(null);
      setOnboardingCompleted(false);
      setHasSeenWelcome(false);
      setError(null);
    } catch (error) {
      console.error('Error resetting all data:', error);
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) return;

      const response = await apiRequest('/api/auth/refresh', {
        method: 'POST',
        auth: true,
      });

      if (response && response.token) {
        await AsyncStorage.setItem('token', response.token);
        setToken(response.token);
      } else {
        // Token refresh failed, logout user
        await logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Token refresh failed, logout user
      await logout();
    }
  };

  const value = {
    token,
    user,
    loading,
    error,
    onboardingCompleted,
    hasSeenWelcome,
    login,
    register,
    logout,
    refreshToken,
    completeOnboarding,
    skipOnboarding,
    markWelcomeSeen,
    resetWelcome,
    resetAllData,
    setError,
    // Trusted contacts
    trustedContacts,
    addTrustedContact,
    removeTrustedContact,
    hasTrustedContact,
    trustedContactPromptDismissed,
    dismissTrustedContactPrompt,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 