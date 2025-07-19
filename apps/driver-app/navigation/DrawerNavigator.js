import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import HomeTabs from './HomeTabs';
import ProfileStack from './ProfileStack';
import Settings from '../components/Settings';
import CustomerCommunication from '../components/CustomerCommunication';
import DriverAnalytics from '../components/DriverAnalytics';
import VerificationStack from './VerificationStack';
import OnboardingStack from './OnboardingStack';
import Logout from '../screens/Logout';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={HomeTabs} options={{ drawerIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Drawer.Screen name="Profile" component={ProfileStack} options={{ drawerIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
      <Drawer.Screen name="Settings" component={Settings} options={{ drawerIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} /> }} />
      <Drawer.Screen name="Support" component={CustomerCommunication} options={{ drawerIcon: ({ color, size }) => <Ionicons name="help-circle" color={color} size={size} /> }} />
      <Drawer.Screen name="Analytics" component={DriverAnalytics} options={{ drawerIcon: ({ color, size }) => <Ionicons name="analytics" color={color} size={size} /> }} />
      <Drawer.Screen name="Verification" component={VerificationStack} options={{ drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark" color={color} size={size} /> }} />
      <Drawer.Screen name="Onboarding" component={OnboardingStack} options={{ drawerIcon: ({ color, size }) => <Ionicons name="walk" color={color} size={size} /> }} />
      <Drawer.Screen name="Logout" component={Logout} options={{ drawerIcon: ({ color, size }) => <Ionicons name="log-out" color={color} size={size} /> }} />
    </Drawer.Navigator>
  );
} 