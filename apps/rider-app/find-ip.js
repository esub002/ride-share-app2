const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const ip = getLocalIPAddress();
console.log('🌐 Your computer\'s IP address is:', ip);
console.log('📱 Update your app.config.js with this IP address:');
console.log(`   API_BASE_URL: "http://${ip}:3000/api"`);
console.log(`   SOCKET_URL: "http://${ip}:3000"`);
console.log('\n💡 Make sure your phone/emulator is on the same WiFi network as your computer!'); 