import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function PasswordResetScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async () => {
    setError(''); setMessage('');
    const res = await fetch('http://localhost:3000/api/auth/user/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      setMessage('Check your email for a reset link or token.');
      setStep(2);
    } else {
      setError('Could not send reset email.');
    }
  };

  const handleReset = async () => {
    setError(''); setMessage('');
    const res = await fetch('http://localhost:3000/api/auth/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword })
    });
    if (res.ok) {
      setMessage('Password reset successful! You can now log in.');
      setStep(1);
    } else {
      setError('Invalid or expired token.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Password Reset</Text>
      {step === 1 ? (
        <>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            inputStyle={{ backgroundColor: '#0c1037', color: '#aeb4cf', borderColor: '#2a2e3e', borderRadius: 8, paddingHorizontal: 12, minHeight: 44 }}
            placeholderTextColor="#72809b"
            style={{ marginVertical: 8 }}
          />
          <Button title="Request Reset" onPress={handleRequest} />
        </>
      ) : (
        <>
          <Input
            placeholder="Reset Token"
            value={token}
            onChangeText={setToken}
            inputStyle={{ backgroundColor: '#0c1037', color: '#aeb4cf', borderColor: '#2a2e3e', borderRadius: 8, paddingHorizontal: 12, minHeight: 44 }}
            placeholderTextColor="#72809b"
            style={{ marginVertical: 8 }}
          />
          <Input
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            inputStyle={{ backgroundColor: '#0c1037', color: '#aeb4cf', borderColor: '#2a2e3e', borderRadius: 8, paddingHorizontal: 12, minHeight: 44 }}
            placeholderTextColor="#72809b"
            style={{ marginVertical: 8 }}
          />
          <Button title="Set New Password" onPress={handleReset} />
        </>
      )}
      <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      {message ? <Text style={{ color: 'green' }}>{message}</Text> : null}
    </View>
  );
}
