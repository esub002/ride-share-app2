import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineManager from './offlineManager';
import performanceOptimizer from './performanceOptimizer';
import { Alert } from 'react-native';

// Backend URL configuration - supports multiple fallback URLs
const BACKEND_URLS = [
  "http://localhost:3003",  // Backend is running on 3003
  "http://localhost:3000",
  "http://localhost:3001", 
  "http://localhost:3002",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://10.1.10.243:3003",
  "http://10.1.10.243:3000",
  "http://127.0.0.1:3003",
  "http://127.0.0.1:3000"
];

// Try to find the working backend URL
let API_BASE_URL = BACKEND_URLS[0];

// Function to test backend connectivity
async function testBackendConnection(url) {
  try {
    console.log(`🔍 Testing backend connection: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Backend connection successful: ${url}`);
      return true;
    } else {
      console.log(`❌ Backend connection failed: ${url} (status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend connection error: ${url} - ${error.message}`);
    return false;
  }
}

// Function to find working backend
async function findWorkingBackend() {
  console.log('🔍 Searching for available backend...');
  
  for (const url of BACKEND_URLS) {
    console.log(`   Testing: ${url}`);
    const isWorking = await testBackendConnection(url);
    if (isWorking) {
      console.log(`✅ Backend found: ${url}`);
      return url;
    }
  }
  
  console.log('⚠️ No backend found, using fallback URL');
  return BACKEND_URLS[0];
}

// Initialize backend URL
(async () => {
  API_BASE_URL = await findWorkingBackend();
})();

// Export the current API base URL
export { API_BASE_URL };

// Mock data for when backend is not available
export const MOCK_DATA = {
  earnings: {
    today: 125.50,
    week: 847.25,
    month: 3240.75,
    total: 15420.50,
  },
  paymentMethods: [
    {
      id: 1,
      type: 'bank',
      accountName: 'Chase Bank',
      accountNumber: '****1234',
      isDefault: true,
    },
    {
      id: 2,
      type: 'card',
      accountName: 'Visa Card',
      accountNumber: '****5678',
      isDefault: false,
    },
  ],
  transactions: [
    {
      id: 1,
      type: 'ride_earnings',
      amount: 25.50,
      description: 'Ride from Downtown to Uptown',
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
    },
    {
      id: 2,
      type: 'tip',
      amount: 5.00,
      description: 'Tip from John D.',
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
    },
    {
      id: 3,
      type: 'withdrawal',
      amount: -500.00,
      description: 'Withdrawal to Chase Bank',
      date: '2024-01-14T15:20:00Z',
      status: 'completed',
    },
  ],
  emergencyContacts: [
    {
      id: 1,
      name: 'Sarah Johnson',
      phone: '+1-555-0123',
      relationship: 'Spouse',
      isDefault: true,
    },
    {
      id: 2,
      name: 'Mike Wilson',
      phone: '+1-555-0456',
      relationship: 'Friend',
      isDefault: false,
    },
  ],
};

// Mock data for offline fallback
const mockData = {
  user: {
    id: 1,
    name: 'John Driver',
    phone: '+1234567890',
    car: 'Toyota Prius 2020',
    email: 'john.driver@example.com',
    rating: 4.8,
    totalRides: 1250,
    totalEarnings: 15420.50
  },
  earnings: {
    today: 85.50,
    week: 420.75,
    month: 1850.25,
    total: 15420.50,
    history: [
      { date: '2024-01-15', amount: 95.25, rides: 8 },
      { date: '2024-01-14', amount: 87.50, rides: 7 },
      { date: '2024-01-13', amount: 102.00, rides: 9 },
      { date: '2024-01-12', amount: 78.25, rides: 6 },
      { date: '2024-01-11', amount: 91.75, rides: 8 }
    ]
  },
  rides: [
    {
      id: 1,
      passenger: 'Sarah Johnson',
      pickup: '123 Main St, Downtown',
      destination: '456 Oak Ave, Uptown',
      fare: 25.50,
      status: 'completed',
      date: '2024-01-15T10:30:00Z',
      rating: 5
    },
    {
      id: 2,
      passenger: 'Mike Chen',
      pickup: '789 Pine St, Midtown',
      destination: '321 Elm St, Downtown',
      fare: 18.75,
      status: 'completed',
      date: '2024-01-15T09:15:00Z',
      rating: 4
    }
  ],
  currentRide: null,
  notifications: [
    {
      id: 1,
      title: 'New Ride Request',
      message: 'Ride request from Downtown to Uptown',
      type: 'ride_request',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]
};

class ApiService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
    this.token = null;
    this.isOnline = true;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.socket = null;
    this.socketConnected = false;
    this.connectedBackend = null;
    
    console.log(`🚀 API Service initialized with base URL: ${this.baseURL}`);
  }

  async init() {
    try {
      console.log('🔧 Initializing API Service...');
      
      // Find working backend
      this.connectedBackend = await findWorkingBackend();
      this.baseURL = `${this.connectedBackend}/api`;
      
      console.log(`✅ API Service connected to: ${this.connectedBackend}`);
      
      // Load stored token
      const storedToken = await AsyncStorage.getItem('driver_token');
      if (storedToken) {
        this.token = storedToken;
        console.log('🔑 Loaded stored authentication token');
      }
      
      // Initialize socket connection
      this.initializeSocket();
      
      return true;
    } catch (error) {
      console.error('❌ API Service initialization failed:', error);
      return false;
    }
  }

  // Initialize Socket.IO connection for real-time updates
  initializeSocket() {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      const { io } = require('socket.io-client');
      this.socket = io(API_BASE_URL, {
        auth: {
          token: this.token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      this.socket.on('connect', () => {
        this.socketConnected = true;
        console.log('🔌 Connected to backend via Socket.IO');
      });
      this.socket.on('disconnect', () => {
        this.socketConnected = false;
        console.log('🔌 Disconnected from backend');
      });
      this.socket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 Socket reconnect attempt ${attempt}`);
      });
      this.socket.on('reconnect_failed', () => {
        console.log('❌ Socket failed to reconnect');
      });
      this.socket.on('error', (error) => {
        Alert.alert('Socket Error', error.message || 'Socket error');
      });

      // Listen for real-time ride requests
      this.socket.on('ride:request', (data) => {
        console.log('🚗 New ride request received:', data);
        // You can emit this to your app state management
        this.emit('newRideRequest', data);
      });

      // Listen for ride status updates
      this.socket.on('ride:statusUpdate', (data) => {
        console.log('📊 Ride status updated:', data);
        this.emit('rideStatusUpdate', data);
      });

    } catch (error) {
      Alert.alert('Socket Error', error.message || 'Socket initialization error');
    }
  }

  // Reconnect socket with new token after login/logout
  setToken(token) {
    this.token = token;
    AsyncStorage.setItem('authToken', token);
    if (token) {
      this.initializeSocket();
    } else {
      if (this.socket) this.socket.disconnect();
      this.socket = null;
      this.socketConnected = false;
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    AsyncStorage.removeItem('authToken');
    this.disconnectSocket();
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Make API request with error handling and offline support
   * @param {string} endpoint
   * @param {object} options
   * @param {string|null} customErrorMsg - Optional custom error message for user feedback
   */
  async request(endpoint, options = {}, customErrorMsg = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    // Check if we're offline
    if (!this.isOnline) {
      console.log('📱 Offline mode - using mock data');
      return this.getMockData(endpoint);
    }
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API Request successful: ${endpoint}`);
          return data;
        } else {
          console.log(`❌ API Request failed (attempt ${attempt}): ${endpoint} - Status: ${response.status}`);
          if (attempt === this.retryAttempts) {
            // If all attempts failed, try to use mock data
            console.log('🔄 Using mock data due to API failure');
            return this.getMockData(endpoint);
          }
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      } catch (error) {
        console.log(`❌ API Request error (attempt ${attempt}): ${endpoint} - ${error.message}`);
        if (attempt === this.retryAttempts) {
          // If all attempts failed, try to use mock data
          console.log('🔄 Using mock data due to network error');
          return this.getMockData(endpoint);
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Get mock data for specific endpoints
  getMockData(endpoint) {
    if (endpoint.includes('/earnings')) {
      return {
        today: 85.50,
        week: 420.75,
        month: 1850.25,
        total: 15420.50
      };
    }
    if (endpoint.includes('/rides')) return mockData.rides;
    if (endpoint.includes('/profile')) return mockData.user;
    if (endpoint.includes('/notifications')) return mockData.notifications;
    return mockData;
  }

  // Authentication methods
  async loginDriver(phone, otp, name = null, carInfo = null) {
    const body = { phone, otp };
    if (name && carInfo) {
      body.name = name;
      body.car_info = carInfo;
    }

    const result = await this.request('/auth/driver/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // Backend returns { token: "...", driver: { id, name, phone, car_info } }
    if (result.token && result.driver) {
      this.setToken(result.token);
      return result;
    }
    
    throw new Error(result.error || 'Login failed');
  }

  async sendOTP(phone) {
    const result = await this.request('/auth/driver/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });

    // Backend returns { message: "OTP sent successfully", otp: "123456" }
    if (result.message && result.otp) {
      return {
        success: true,
        message: result.message,
        otp: result.otp
      };
    }
    
    throw new Error(result.error || 'Failed to send OTP');
  }

  // Driver profile methods
  async getDriverProfile() {
    try {
      const result = await this.request('/drivers/profile');
      return result.data || result;
    } catch (error) {
      console.log('❌ Failed to fetch driver profile:', error);
      // Return a mock profile if backend is not available
      return {
        id: 1,
        name: 'John Driver',
        phone: '+1234567890',
        car: 'Toyota Camry',
        email: 'john.driver@example.com',
        available: true,
        verification_status: 'verified'
      };
    }
  }

  async updateDriverProfile(profileData) {
    const result = await this.request('/drivers/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return result.data;
  }

  async updateDriverLocation(latitude, longitude) {
    const result = await this.request('/drivers/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude })
    });

    // Also emit to socket for real-time updates
    if (this.socket) {
      this.socket.emit('driver:location', { latitude, longitude });
    }

    return result.data;
  }

  async toggleAvailability(available) {
    const result = await this.request('/drivers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ available })
    });
    return result.data;
  }

  // Update driver availability (online/offline)
  async updateAvailability(available) {
    // Try to get driver ID from global.user, profile, or token
    const driverId = (global.user && global.user.id) || (this.profile && this.profile.id);
    if (!driverId) throw new Error('No driver ID found for availability update');
    return this.request(`/drivers/${driverId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Earnings and financial methods
  async getEarningsData(period = 'week') {
    const result = await this.request(`/drivers/earnings?period=${period}`);
    return result.data;
  }

  async getRideHistory(page = 1, limit = 10) {
    const result = await this.request(`/drivers/trips?page=${page}&limit=${limit}`);
    return result.data;
  }

  async getDriverStats() {
    const result = await this.request('/drivers/stats');
    return result.data;
  }

  // Ride management methods
  async getCurrentRide() {
    const result = await this.request('/drivers/current-ride');
    return result.data;
  }

  async getAvailableRides() {
    const result = await this.request('/rides?status=requested');
    return result.data;
  }

  async acceptRide(rideId) {
    const result = await this.request(`/rides/${rideId}/accept`, {
      method: 'POST'
    });

    // Emit to socket
    if (this.socket) {
      this.socket.emit('ride:accept', { rideId });
    }

    return result.data;
  }

  async rejectRide(rideId, reason = '') {
    const result = await this.request(`/rides/${rideId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return result.data;
  }

  async updateRideStatus(rideId, status) {
    const result = await this.request(`/rides/${rideId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    // Emit to socket
    if (this.socket) {
      this.socket.emit('ride:statusUpdate', { rideId, status });
    }

    return result.data;
  }

  async completeRide(rideId) {
    const result = await this.request(`/rides/${rideId}/complete`, {
      method: 'POST'
    });
    return result.data;
  }

  // Safety and emergency methods
  async reportEmergency(emergencyData) {
    const result = await this.request('/safety/emergency', {
      method: 'POST',
      body: JSON.stringify(emergencyData)
    });
    return result.data;
  }

  async getSafetyAlerts() {
    const result = await this.request('/safety/alerts');
    return result.data;
  }

  async checkIn(location, status = 'safe') {
    const result = await this.request('/safety/check-in', {
      method: 'POST',
      body: JSON.stringify({ location, status })
    });
    return result.data;
  }

  // Notification methods
  async getNotifications() {
    const result = await this.request('/notifications');
    return result.data;
  }

  async markNotificationRead(notificationId) {
    const result = await this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    return result.data;
  }

  // Utility methods
  async clearCache() {
    await offlineManager.clearCache();
    return { success: true };
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      hasToken: !!this.token,
      socketConnected: this.socket?.connected || false
    };
  }

  // Expose socket connection status
  getSocketStatus() {
    return this.socketConnected;
  }

  // Socket event emitter (for app state management)
  emit(event, data) {
    // This can be connected to your app's event system
    console.log(`📡 Emitting event: ${event}`, data);
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;