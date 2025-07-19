import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      rideUpdates: true,
      systemAlerts: true,
      marketing: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    },
    platform: {
      maintenanceMode: false,
      autoApproveDrivers: false,
      requireDocuments: true,
      maxRideDistance: 50,
      commissionRate: 15
    },
    appearance: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    // In a real app, you'd save to backend
    setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
  };

  const handleReset = () => {
    setSnackbar({ open: true, message: 'Settings reset to defaults', severity: 'info' });
  };

  const SettingCard = ({ title, icon, children }) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
      />
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="textSecondary" mb={4}>
          Configure your platform settings and preferences
        </Typography>

        <Grid container spacing={3}>
          {/* Notifications Settings */}
          <Grid item xs={12} md={6}>
            <SettingCard title="Notifications" icon={<NotificationsIcon />}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive updates via email"
                  />
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Push Notifications"
                    secondary="Receive push notifications"
                  />
                  <Switch
                    checked={settings.notifications.push}
                    onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="SMS Notifications"
                    secondary="Receive updates via SMS"
                  />
                  <Switch
                    checked={settings.notifications.sms}
                    onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Ride Updates"
                    secondary="Get notified about ride status changes"
                  />
                  <Switch
                    checked={settings.notifications.rideUpdates}
                    onChange={(e) => handleSettingChange('notifications', 'rideUpdates', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="System Alerts"
                    secondary="Receive system and security alerts"
                  />
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                  />
                </ListItem>
              </List>
            </SettingCard>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <SettingCard title="Security" icon={<SecurityIcon />}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security"
                  />
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Session Timeout"
                    secondary={`${settings.security.sessionTimeout} minutes`}
                  />
                  <Slider
                    value={settings.security.sessionTimeout}
                    onChange={(e, value) => handleSettingChange('security', 'sessionTimeout', value)}
                    min={5}
                    max={120}
                    step={5}
                    sx={{ width: 100 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Password Expiry"
                    secondary={`${settings.security.passwordExpiry} days`}
                  />
                  <Slider
                    value={settings.security.passwordExpiry}
                    onChange={(e, value) => handleSettingChange('security', 'passwordExpiry', value)}
                    min={30}
                    max={365}
                    step={30}
                    sx={{ width: 100 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Login Attempts"
                    secondary={`${settings.security.loginAttempts} attempts before lockout`}
                  />
                  <Slider
                    value={settings.security.loginAttempts}
                    onChange={(e, value) => handleSettingChange('security', 'loginAttempts', value)}
                    min={3}
                    max={10}
                    step={1}
                    sx={{ width: 100 }}
                  />
                </ListItem>
              </List>
            </SettingCard>
          </Grid>

          {/* Platform Settings */}
          <Grid item xs={12} md={6}>
            <SettingCard title="Platform Configuration" icon={<SettingsIcon />}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Maintenance Mode"
                    secondary="Put platform in maintenance mode"
                  />
                  <Switch
                    checked={settings.platform.maintenanceMode}
                    onChange={(e) => handleSettingChange('platform', 'maintenanceMode', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Auto-Approve Drivers"
                    secondary="Automatically approve new driver registrations"
                  />
                  <Switch
                    checked={settings.platform.autoApproveDrivers}
                    onChange={(e) => handleSettingChange('platform', 'autoApproveDrivers', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Require Documents"
                    secondary="Require document verification for drivers"
                  />
                  <Switch
                    checked={settings.platform.requireDocuments}
                    onChange={(e) => handleSettingChange('platform', 'requireDocuments', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Max Ride Distance"
                    secondary={`${settings.platform.maxRideDistance} km`}
                  />
                  <Slider
                    value={settings.platform.maxRideDistance}
                    onChange={(e, value) => handleSettingChange('platform', 'maxRideDistance', value)}
                    min={10}
                    max={100}
                    step={5}
                    sx={{ width: 100 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Commission Rate"
                    secondary={`${settings.platform.commissionRate}%`}
                  />
                  <Slider
                    value={settings.platform.commissionRate}
                    onChange={(e, value) => handleSettingChange('platform', 'commissionRate', value)}
                    min={5}
                    max={30}
                    step={1}
                    sx={{ width: 100 }}
                  />
                </ListItem>
              </List>
            </SettingCard>
          </Grid>

          {/* Appearance Settings */}
          <Grid item xs={12} md={6}>
            <SettingCard title="Appearance" icon={<PaletteIcon />}>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    label="Theme"
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.appearance.language}
                    label="Language"
                    onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.appearance.timezone}
                    label="Timezone"
                    onChange={(e) => handleSettingChange('appearance', 'timezone', e.target.value)}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="EST">Eastern Time</MenuItem>
                    <MenuItem value="PST">Pacific Time</MenuItem>
                    <MenuItem value="GMT">GMT</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </SettingCard>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            size="large"
          >
            Save Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            size="large"
          >
            Reset to Defaults
          </Button>
        </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default Settings; 