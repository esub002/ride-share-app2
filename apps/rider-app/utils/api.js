// Centralized API utility for rider-app
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants?.manifest?.extra?.API_BASE_URL || 'http://localhost:3000/api';
const TEST_MODE = true;

async function getToken() {
  try {
    return await AsyncStorage.getItem('token');
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, auth = false, params = {} } = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = auth ? await getToken() : null;
  const fetchHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;
  const options = {
    method,
    headers: fetchHeaders,
  };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API Error');
    return data;
  } catch (err) {
    // Provide mock data for /api/rides in test mode or offline
    if (TEST_MODE && endpoint === '/api/rides') {
      return [
        {
          id: 1,
          origin: 'Downtown',
          destination: 'Airport',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          fare: 18.5,
          status: 'completed',
        },
        {
          id: 2,
          origin: 'Mall',
          destination: 'University',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          fare: 12.0,
          status: 'completed',
        },
        {
          id: 3,
          origin: 'Home',
          destination: 'Office',
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          fare: 9.75,
          status: 'completed',
        },
      ];
    }
    // Provide mock data for wallet balance
    if (TEST_MODE && endpoint === '/api/payments/wallet/balance') {
      return {
        balance: 42.50,
        cashback: 5.00,
        points: 120,
      };
    }
    // Provide mock data for wallet transactions
    if (TEST_MODE && endpoint === '/api/payments/transactions') {
      return [
        {
          id: 1,
          type: 'ride',
          description: 'Ride to Airport',
          amount: -18.5,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 2,
          type: 'add_money',
          description: 'Added Money',
          amount: 50.0,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 3,
          type: 'cashback',
          description: 'Cashback Reward',
          amount: 5.0,
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
      ];
    }
    throw err;
  }
}

export async function requestRide({ pickup, destination, riderId }) {
  const response = await fetch('/api/rides/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pickup, destination, riderId })
  });
  if (!response.ok) throw new Error('Failed to request ride');
  return await response.json();
} 