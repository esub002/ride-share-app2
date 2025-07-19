import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert, Link } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('/api/admin/auth/login', { 
        email, 
        password 
      });
      
      if (response.data.token) {
        login(response.data.user);
        navigate('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleSkipSignIn = () => {
    // Demo admin user object
    const demoUser = {
      id: 0,
      name: 'Demo Admin',
      email: 'demo@admin.com',
      role: 'admin',
      status: 'active'
    };
    login(demoUser);
    navigate('/');
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Admin Login</Typography>
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField 
            margin="normal" 
            required 
            fullWidth 
            label="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            autoFocus 
          />
          <TextField 
            margin="normal" 
            required 
            fullWidth 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ mb: 2 }}
            onClick={handleSkipSignIn}
          >
            Skip Sign In
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/signup" variant="body2">
              Don't have an account? Sign up
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Login; 