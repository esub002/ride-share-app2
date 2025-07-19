import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SOCKET_URL = Constants?.manifest?.extra?.SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        this.reconnectAttempts++;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed');
      });

      // Handle ride-related events
      this.socket.on('ride:update', (data) => {
        console.log('🚗 Ride update received:', data);
        this.emitToListeners('ride:update', data);
      });

      this.socket.on('ride:accepted', (data) => {
        console.log('✅ Ride accepted:', data);
        this.emitToListeners('ride:accepted', data);
      });

      this.socket.on('ride:cancelled', (data) => {
        console.log('❌ Ride cancelled:', data);
        this.emitToListeners('ride:cancelled', data);
      });

      this.socket.on('ride:completed', (data) => {
        console.log('🏁 Ride completed:', data);
        this.emitToListeners('ride:completed', data);
      });

      this.socket.on('location:update', (data) => {
        console.log('📍 Driver location update:', data);
        this.emitToListeners('location:update', data);
      });

      this.socket.on('message:new', (data) => {
        console.log('💬 New message received:', data);
        this.emitToListeners('message:new', data);
      });

      this.socket.on('emergency:triggered', (data) => {
        console.log('🚨 Emergency triggered:', data);
        this.emitToListeners('emergency:triggered', data);
      });

    } catch (error) {
      console.error('❌ Error connecting to socket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Emit events to backend
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
    }
  }

  // Listen for events from backend
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit to local listeners
  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket listener:', error);
        }
      });
    }
  }

  // Ride-specific methods
  requestRide(rideData) {
    this.emit('ride:request', rideData);
  }

  cancelRide(rideId) {
    this.emit('ride:cancel', { rideId });
  }

  sendMessage(rideId, message) {
    this.emit('message:send', { rideId, message });
  }

  updateLocation(location) {
    this.emit('location:update', location);
  }

  triggerEmergency(rideId, location) {
    this.emit('emergency:trigger', { rideId, location });
  }

  // --- Real-time Auth Methods ---
  register({ phone, email, name, role = 'rider' }, callback) {
    this.emit('register', { phone, email, name, role });
    this.socket.once('otp_sent', (data) => callback && callback(null, data));
    this.socket.once('otp_error', (err) => callback && callback(err));
  }

  verifyOtp({ phone, otp }, callback) {
    this.emit('verify_otp', { phone, otp });
    this.socket.once('verified', (data) => {
      if (data.token) {
        try { AsyncStorage.setItem('rider_token', data.token); } catch {}
      }
      callback && callback(null, data);
    });
    this.socket.once('otp_error', (err) => callback && callback(err));
  }

  login({ phone }, callback) {
    this.emit('login', { phone });
    this.socket.once('login_success', (data) => {
      if (data.token) {
        try { AsyncStorage.setItem('rider_token', data.token); } catch {}
      }
      callback && callback(null, data);
    });
    this.socket.once('login_error', (err) => callback && callback(err));
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 