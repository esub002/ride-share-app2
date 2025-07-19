import AsyncStorage from '@react-native-async-storage/async-storage';

// Utility function to clear all AsyncStorage data
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All AsyncStorage data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
    return false;
  }
};

// Utility function to clear specific keys
export const clearSpecificKeys = async (keys) => {
  try {
    const promises = keys.map(key => AsyncStorage.removeItem(key));
    await Promise.all(promises);
    console.log('✅ Specific keys cleared successfully:', keys);
    return true;
  } catch (error) {
    console.error('❌ Error clearing specific keys:', error);
    return false;
  }
};

// Utility function to view all stored keys
export const viewAllStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    console.log('📋 All stored data:');
    result.forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    return result;
  } catch (error) {
    console.error('❌ Error viewing storage:', error);
    return null;
  }
};

// Function to reset app to initial state
export const resetAppToInitialState = async () => {
  try {
    // Clear all storage
    await AsyncStorage.clear();
    
    // Log the reset
    console.log('🔄 App reset to initial state');
    console.log('📱 Welcome screen will show on next app launch');
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting app:', error);
    return false;
  }
};

// Export default function for easy import
export default {
  clearAllStorage,
  clearSpecificKeys,
  viewAllStorage,
  resetAppToInitialState,
}; 