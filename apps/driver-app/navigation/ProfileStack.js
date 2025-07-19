import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Profile from '../components/Profile';
import VerificationStack from './VerificationStack';

const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="EditProfile" component={Profile} />
      <Stack.Screen name="VerificationStack" component={VerificationStack} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
} 