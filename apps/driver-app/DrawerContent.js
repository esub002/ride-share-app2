import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import * as ImagePicker from 'expo-image-picker';
import NotificationSettings from './components/NotificationSettings';
import apiService from './utils/api';

export default function DrawerContent(props) {
  const { user, setLoggedIn } = props;
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: setLoggedIn,
        },
      ]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setUploading(true);
      try {
        // Upload to backend (implement this endpoint in your backend)
        const formData = new FormData();
        formData.append('profileImage', {
          uri: result.assets[0].uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
        // Example: await apiService.uploadProfileImage(formData);
        setProfileImage(result.assets[0].uri);
        // Optionally update user profile in global state
      } catch (e) {
        Alert.alert('Error', 'Failed to upload image.');
      } finally {
        setUploading(false);
      }
    }
  };

  const menuItems = [
    {
      name: "Home",
      icon: "home",
      screen: "Home",
    },
    {
      name: "Ride Management",
      icon: "car",
      screen: "RideManagement",
    },
    {
      name: "Earnings & Finance",
      icon: "wallet",
      screen: "EarningsFinance",
    },
    {
      name: "Safety & Communication",
      icon: "shield",
      screen: "SafetyCommunication",
    },
    {
      name: "Profile",
      icon: "person",
      screen: "Profile",
    },
    {
      name: "Wallet",
      icon: "wallet",
      screen: "Wallet",
    },
    {
      name: "Trip History",
      icon: "time",
      screen: "TripHistory",
    },
    {
      name: "Customer Communication",
      icon: "chatbubbles",
      screen: "CustomerCommunication",
    },
    {
      name: "Safety Features",
      icon: "shield",
      screen: "SafetyFeatures",
    },
    {
      name: "Settings",
      icon: "settings",
      screen: "Settings",
    },
    {
      name: "Theme",
      icon: "color-palette",
      screen: "Theme",
    },
    {
      name: "Voice Commands",
      icon: "mic",
      screen: "VoiceCommands",
    },
    {
      name: "Advanced Safety",
      icon: "shield",
      screen: "AdvancedSafety",
    },
    {
      name: "Analytics",
      icon: "analytics",
      screen: "DriverAnalytics",
    },
    {
      name: "Notification Settings",
      icon: "notifications",
      screen: "NotificationSettings",
    },
  ];

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} disabled={uploading}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={72} color="#bbb" />
            )}
            <View style={styles.cameraIconWrapper}>
              <Ionicons name="camera" size={20} color="#fff" style={styles.cameraIcon} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{user?.name || "Driver"}</Text>
          <Text style={styles.profileCar}>{user?.car || "Vehicle"}</Text>
          <Text style={styles.profilePhone}>{user?.phone || ""}</Text>
          <Text style={styles.profileEmail}>{user?.email || ""}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => props.navigation.navigate('Profile')}>
            <Ionicons name="create-outline" size={16} color="#2196F3" />
            <Text style={styles.editProfileText}>View/Edit Profile</Text>
          </TouchableOpacity>
          {/* Verification Button with Status */}
          <TouchableOpacity style={styles.verificationBtn} onPress={() => props.navigation.navigate('Verification')}>
            <Ionicons name="shield-checkmark" size={16} color={user?.verification_status === 'verified' ? '#4CAF50' : user?.verification_status === 'rejected' ? '#D32F2F' : '#FBC02D'} />
            <Text style={styles.verificationText}>Verification</Text>
            {user?.verification_status === 'verified' && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.verificationStatusIcon} />
            )}
            {user?.verification_status === 'pending' && (
              <Ionicons name="alert-circle" size={16} color="#FBC02D" style={styles.verificationStatusIcon} />
            )}
            {user?.verification_status === 'rejected' && (
              <Ionicons name="close-circle" size={16} color="#D32F2F" style={styles.verificationStatusIcon} />
            )}
          </TouchableOpacity>
          {/* Contact Info Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactHeader}>Contact Info</Text>
            <Text style={styles.contactLabel}>Emergency:</Text>
            <Text style={styles.contactValue}>{user?.emergencyContact || 'Not set'}</Text>
            <Text style={styles.contactLabel}>Support:</Text>
            <Text style={styles.contactValue}>{user?.supportContact || '+1-800-555-1234'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                props.navigation.navigate(item.screen);
                props.navigation.closeDrawer();
              }}
            >
              <Ionicons name={item.icon} size={22} color="#333" />
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>
      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#FF5722" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eee',
  },
  cameraIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIcon: {
    alignSelf: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  profileCar: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 6,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  editProfileText: {
    fontSize: 13,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
  },
  menuSection: {
    paddingTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginBottom: 1,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 14,
    fontWeight: '500',
  },
  logoutSection: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 15,
    color: "#FF5722",
    marginLeft: 12,
    fontWeight: "600",
  },
  verificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  verificationText: {
    fontSize: 13,
    color: '#388E3C',
    marginLeft: 4,
    fontWeight: '600',
  },
  contactSection: {
    marginTop: 10,
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
  },
  contactHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  contactValue: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  verificationStatusIcon: {
    marginLeft: 6,
  },
});
