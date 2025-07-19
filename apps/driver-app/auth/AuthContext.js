import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Sync with global user data
  useEffect(() => {
    if (global.user) {
      setUser(global.user);
    }
    if (global.token) {
      setToken(global.token);
    }
  }, []);

  const login = async (email, password) => {
    try {
      // For demo purposes, create a mock user
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Driver',
        email: email,
        phone: '+1234567890',
        verified: true,
        type: 'driver',
      };

      const mockToken = 'mock_jwt_token_' + Date.now();
      
      setToken(mockToken);
      setUser(mockUser);
      
      // Also set global user for compatibility
      global.user = mockUser;
      global.token = mockToken;
      
      return true;
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    global.user = null;
    global.token = null;
  };

  // Update user when global user changes
  useEffect(() => {
    const checkGlobalUser = () => {
      if (global.user && !user) {
        setUser(global.user);
      }
      if (global.token && !token) {
        setToken(global.token);
      }
    };

    // Check immediately
    checkGlobalUser();

    // Set up interval to check for changes
    const interval = setInterval(checkGlobalUser, 1000);

    return () => clearInterval(interval);
  }, [user, token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
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
