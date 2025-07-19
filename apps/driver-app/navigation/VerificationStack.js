import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VerificationScreen from '../screens/VerificationScreen';

const Stack = createStackNavigator();

export default function VerificationStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="DocumentUpload" component={VerificationScreen} />
    </Stack.Navigator>
  );
} 