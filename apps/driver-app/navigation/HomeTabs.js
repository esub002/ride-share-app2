import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DriverHome from '../DriverHome';
import RideManagement from '../components/RideManagement';
import EarningsFinance from '../components/EarningsFinance';
import Wallet from '../components/Wallet';
import NotificationTest from '../components/NotificationTest';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard': iconName = 'home'; break;
            case 'Rides': iconName = 'car'; break;
            case 'Earnings': iconName = 'cash'; break;
            case 'Wallet': iconName = 'wallet'; break;
            case 'Notifications': iconName = 'notifications'; break;
            case 'Profile': iconName = 'person'; break;
            default: iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverHome} />
      <Tab.Screen name="Rides" component={RideManagement} />
      <Tab.Screen name="Earnings" component={EarningsFinance} />
      <Tab.Screen name="Wallet" component={Wallet} />
      <Tab.Screen name="Notifications" component={NotificationTest} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
} 