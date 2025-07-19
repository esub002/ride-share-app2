// Test script to verify authentication fix
const apiService = require('./utils/api').default;

async function testAuthentication() {
  console.log('🧪 Testing authentication flow...');
  
  try {
    // Test API initialization
    console.log('1. Testing API initialization...');
    const initResult = await apiService.init();
    console.log('✅ API init result:', initResult);
    
    // Test getting status
    console.log('2. Testing API status...');
    const status = apiService.getStatus();
    console.log('✅ API status:', status);
    
    // Test getting driver profile
    console.log('3. Testing driver profile fetch...');
    const profile = await apiService.getDriverProfile();
    console.log('✅ Driver profile:', profile);
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthentication(); 