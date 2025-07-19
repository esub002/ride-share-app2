import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';

export default function Profile({ navigation }) {
  const auth = useAuth();
  const user = auth?.user || {
    firstName: 'Demo',
    lastName: 'Driver',
    email: 'demo@example.com',
    phone: '+1234567890',
  };
  const logout = auth?.logout || (() => {});
  
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verification states
  const [verificationStatus, setVerificationStatus] = useState({
    phone: true,
    ssn: false,
    license: false,
    insurance: false,
    background: false,
    profile: true,
  });

  // Form data
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    ssn: '',
    driversLicense: '',
    licenseState: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    insuranceProvider: '',
    dateOfBirth: '',
    address: '',
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      plateNumber: '',
      color: '',
    },
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateVehicleInfo = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        ...prev.vehicleInfo,
        [field]: value,
      },
    }));
  };

  // Mock verification handlers
  const handleSSNVerification = async () => {
    if (!formData.ssn || formData.ssn.length !== 9) {
      setError('Please enter a valid 9-digit SSN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerificationStatus(prev => ({ ...prev, ssn: true }));
      Alert.alert('Success', 'SSN verification completed successfully');
    } catch (error) {
      setError('SSN verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseVerification = async () => {
    if (!formData.driversLicense || !formData.licenseState) {
      setError('Please enter both license number and state');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerificationStatus(prev => ({ ...prev, license: true }));
      Alert.alert('Success', 'License verification completed successfully');
    } catch (error) {
      setError('License verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceVerification = async () => {
    if (!formData.insuranceNumber || !formData.insuranceExpiry) {
      setError('Please enter insurance number and expiry date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerificationStatus(prev => ({ ...prev, insurance: true }));
      Alert.alert('Success', 'Insurance verification completed successfully');
    } catch (error) {
      setError('Insurance verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundCheck = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      setVerificationStatus(prev => ({ ...prev, background: true }));
      Alert.alert('Success', 'Background check completed successfully');
    } catch (error) {
      setError('Background check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Profile</Text>
        <Text style={styles.sidebarSubtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.sidebarMenu}>
        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'overview' && styles.menuItemActive]}
          onPress={() => setActiveSection('overview')}
        >
          <Ionicons name="person" size={20} color={activeSection === 'overview' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'overview' && styles.menuTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'ssn' && styles.menuItemActive]}
          onPress={() => setActiveSection('ssn')}
        >
          <Ionicons name="card" size={20} color={activeSection === 'ssn' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'ssn' && styles.menuTextActive]}>
            SSN Verification
          </Text>
          {verificationStatus.ssn && <View style={styles.verifiedBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'license' && styles.menuItemActive]}
          onPress={() => setActiveSection('license')}
        >
          <Ionicons name="car" size={20} color={activeSection === 'license' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'license' && styles.menuTextActive]}>
            Driver's License
          </Text>
          {verificationStatus.license && <View style={styles.verifiedBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'insurance' && styles.menuItemActive]}
          onPress={() => setActiveSection('insurance')}
        >
          <Ionicons name="shield-checkmark" size={20} color={activeSection === 'insurance' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'insurance' && styles.menuTextActive]}>
            Insurance
          </Text>
          {verificationStatus.insurance && <View style={styles.verifiedBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'background' && styles.menuItemActive]}
          onPress={() => setActiveSection('background')}
        >
          <Ionicons name="shield" size={20} color={activeSection === 'background' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'background' && styles.menuTextActive]}>
            Background Check
          </Text>
          {verificationStatus.background && <View style={styles.verifiedBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'vehicle' && styles.menuItemActive]}
          onPress={() => setActiveSection('vehicle')}
        >
          <Ionicons name="car-sport" size={20} color={activeSection === 'vehicle' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'vehicle' && styles.menuTextActive]}>
            Vehicle Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeSection === 'settings' && styles.menuItemActive]}
          onPress={() => setActiveSection('settings')}
        >
          <Ionicons name="settings" size={20} color={activeSection === 'settings' ? '#2196F3' : '#72809b'} />
          <Text style={[styles.menuText, activeSection === 'settings' && styles.menuTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out" size={20} color="#ff4757" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Overview</Text>
        <Text style={styles.subtitle}>Manage your driver account and verifications</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profilePhone}>{user.phone}</Text>
          </View>
        </View>

        <View style={styles.verificationSummary}>
          <Text style={styles.summaryTitle}>Verification Status</Text>
          <View style={styles.verificationGrid}>
            <View style={styles.verificationItem}>
              <Ionicons name="call" size={20} color={verificationStatus.phone ? '#4CAF50' : '#FF9800'} />
              <Text style={styles.verificationText}>Phone</Text>
              <Text style={[styles.verificationStatus, { color: verificationStatus.phone ? '#4CAF50' : '#FF9800' }]}>
                {verificationStatus.phone ? 'Verified' : 'Pending'}
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons name="card" size={20} color={verificationStatus.ssn ? '#4CAF50' : '#FF9800'} />
              <Text style={styles.verificationText}>SSN</Text>
              <Text style={[styles.verificationStatus, { color: verificationStatus.ssn ? '#4CAF50' : '#FF9800' }]}>
                {verificationStatus.ssn ? 'Verified' : 'Pending'}
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons name="car" size={20} color={verificationStatus.license ? '#4CAF50' : '#FF9800'} />
              <Text style={styles.verificationText}>License</Text>
              <Text style={[styles.verificationStatus, { color: verificationStatus.license ? '#4CAF50' : '#FF9800' }]}>
                {verificationStatus.license ? 'Verified' : 'Pending'}
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons name="shield-checkmark" size={20} color={verificationStatus.insurance ? '#4CAF50' : '#FF9800'} />
              <Text style={styles.verificationText}>Insurance</Text>
              <Text style={[styles.verificationStatus, { color: verificationStatus.insurance ? '#4CAF50' : '#FF9800' }]}>
                {verificationStatus.insurance ? 'Verified' : 'Pending'}
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons name="shield" size={20} color={verificationStatus.background ? '#4CAF50' : '#FF9800'} />
              <Text style={styles.verificationText}>Background</Text>
              <Text style={[styles.verificationStatus, { color: verificationStatus.background ? '#4CAF50' : '#FF9800' }]}>
                {verificationStatus.background ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSSNVerification = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SSN Verification</Text>
        <Text style={styles.sectionDescription}>
          Enter your Social Security Number for background verification
        </Text>

        <Input
          placeholder="SSN (9 digits)"
          value={formData.ssn}
          onChangeText={(text) => updateFormData('ssn', text.replace(/\D/g, '').slice(0, 9))}
          keyboardType="numeric"
          secureTextEntry
          style={styles.input}
        />

        <Button
          title={verificationStatus.ssn ? "Re-verify SSN" : "Verify SSN"}
          onPress={handleSSNVerification}
          disabled={loading}
          style={styles.button}
        />

        {verificationStatus.ssn && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.successText}>SSN verification completed</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderLicenseVerification = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver's License Verification</Text>
        <Text style={styles.sectionDescription}>
          Enter your driver's license information for verification
        </Text>

        <Input
          placeholder="Driver's License Number"
          value={formData.driversLicense}
          onChangeText={(text) => updateFormData('driversLicense', text.toUpperCase())}
          style={styles.input}
        />

        <Input
          placeholder="State (e.g., CA, NY, TX)"
          value={formData.licenseState}
          onChangeText={(text) => updateFormData('licenseState', text.toUpperCase())}
          style={styles.input}
        />

        <Button
          title={verificationStatus.license ? "Re-verify License" : "Verify License"}
          onPress={handleLicenseVerification}
          disabled={loading}
          style={styles.button}
        />

        {verificationStatus.license && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.successText}>License verification completed</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderInsuranceVerification = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance Verification</Text>
        <Text style={styles.sectionDescription}>
          Enter your vehicle insurance information
        </Text>

        <Input
          placeholder="Insurance Policy Number"
          value={formData.insuranceNumber}
          onChangeText={(text) => updateFormData('insuranceNumber', text)}
          style={styles.input}
        />

        <Input
          placeholder="Insurance Provider"
          value={formData.insuranceProvider}
          onChangeText={(text) => updateFormData('insuranceProvider', text)}
          style={styles.input}
        />

        <Input
          placeholder="Expiry Date (MM/YYYY)"
          value={formData.insuranceExpiry}
          onChangeText={(text) => updateFormData('insuranceExpiry', text)}
          style={styles.input}
        />

        <Button
          title={verificationStatus.insurance ? "Re-verify Insurance" : "Verify Insurance"}
          onPress={handleInsuranceVerification}
          disabled={loading}
          style={styles.button}
        />

        {verificationStatus.insurance && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.successText}>Insurance verification completed</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderBackgroundCheck = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Check</Text>
        <Text style={styles.sectionDescription}>
          Comprehensive background check including criminal record, driving history, and references
        </Text>

        <Button
          title={verificationStatus.background ? "Re-run Background Check" : "Start Background Check"}
          onPress={handleBackgroundCheck}
          disabled={loading}
          style={styles.button}
        />

        {verificationStatus.background && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.successText}>Background check completed</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderVehicleInfo = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <Text style={styles.sectionDescription}>
          Update your vehicle details
        </Text>

        <Input
          placeholder="Vehicle Make"
          value={formData.vehicleInfo.make}
          onChangeText={(text) => updateVehicleInfo('make', text)}
          style={styles.input}
        />

        <Input
          placeholder="Vehicle Model"
          value={formData.vehicleInfo.model}
          onChangeText={(text) => updateVehicleInfo('model', text)}
          style={styles.input}
        />

        <Input
          placeholder="Vehicle Year"
          value={formData.vehicleInfo.year}
          onChangeText={(text) => updateVehicleInfo('year', text)}
          keyboardType="numeric"
          style={styles.input}
        />

        <Input
          placeholder="License Plate Number"
          value={formData.vehicleInfo.plateNumber}
          onChangeText={(text) => updateVehicleInfo('plateNumber', text.toUpperCase())}
          style={styles.input}
        />

        <Input
          placeholder="Vehicle Color"
          value={formData.vehicleInfo.color}
          onChangeText={(text) => updateVehicleInfo('color', text)}
          style={styles.input}
        />

        <Button
          title="Save Vehicle Info"
          onPress={() => Alert.alert('Success', 'Vehicle information saved')}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Location Services</Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-Accept Rides</Text>
          <Switch value={false} onValueChange={() => {}} />
        </View>

        <Button
          title="Logout"
          onPress={logout}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'ssn':
        return renderSSNVerification();
      case 'license':
        return renderLicenseVerification();
      case 'insurance':
        return renderInsuranceVerification();
      case 'background':
        return renderBackgroundCheck();
      case 'vehicle':
        return renderVehicleInfo();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layout}>
        {renderSidebar()}
        <View style={styles.mainContent}>
          {renderContent()}
        </View>
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1037',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#1a1f3a',
    borderRightWidth: 1,
    borderRightColor: '#2a2e3e',
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3e',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: '#72809b',
  },
  sidebarMenu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3e',
  },
  menuItemActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  menuText: {
    fontSize: 16,
    color: '#72809b',
    marginLeft: 12,
    flex: 1,
  },
  menuTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  verifiedBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2e3e',
  },
  logoutText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginLeft: 12,
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#aeb4cf',
  },
  profileCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#aeb4cf',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#aeb4cf',
  },
  verificationSummary: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  verificationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  verificationItem: {
    width: '45%', // Adjust as needed for grid layout
    alignItems: 'center',
    marginBottom: 15,
  },
  verificationText: {
    fontSize: 14,
    color: '#aeb4cf',
    marginTop: 8,
  },
  verificationStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3e',
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
  },
}); 