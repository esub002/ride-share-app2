import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const success = await login(email, password);
    if (!success) setError('Invalid credentials or not verified.');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Login</Text>
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        inputStyle={{ backgroundColor: '#0c1037', color: '#aeb4cf', borderColor: '#2a2e3e', borderRadius: 8, paddingHorizontal: 12, minHeight: 44 }}
        placeholderTextColor="#72809b"
        style={{ marginVertical: 8 }}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        inputStyle={{ backgroundColor: '#0c1037', color: '#aeb4cf', borderColor: '#2a2e3e', borderRadius: 8, paddingHorizontal: 12, minHeight: 44 }}
        placeholderTextColor="#72809b"
        style={{ marginVertical: 8 }}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} />
      <Button title="Forgot Password?" onPress={() => navigation.navigate('PasswordReset')} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
    </View>
  );
}
