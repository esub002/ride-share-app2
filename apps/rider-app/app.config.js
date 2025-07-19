export default {
  expo: {
    name: "RideShare Rider",
    slug: "rideshare-rider",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Replace YOUR_COMPUTER_IP with your actual IP address
      // You can find this by running 'ipconfig' in Windows or 'ifconfig' in Mac/Linux
      // Look for IPv4 Address under your WiFi adapter
      API_BASE_URL: "http://192.168.1.100:3000/api", // Change this to your IP
      SOCKET_URL: "http://192.168.1.100:3000", // Change this to your IP
    }
  }
}; 