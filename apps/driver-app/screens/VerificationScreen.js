import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/api';
import { ErrorContext } from '../App';

const STEPS = [
  'Profile Info',
  'Document Upload',
  'Background Check',
  'Complete',
];

export default function VerificationScreen({ navigation }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState({ license: null, registration: null, insurance: null });
  const [step, setStep] = useState(1);
  const { setError } = useContext(ErrorContext);
  const [uploadingType, setUploadingType] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const userId = global.user?.id;
      const res = await apiService.request(`/drivers/${userId}/verification-status`);
      setStatus(res);
      setDocs({
        license: res.license_image || null,
        registration: res.registration_image || null,
        insurance: res.insurance_image || null,
      });
      // Determine step
      if (res.verification_status === 'verified') setStep(4);
      else if (res.background_check_status === 'approved') setStep(3);
      else if (res.license_image && res.registration_image && res.insurance_image) setStep(3);
      else setStep(2);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch verification status.');
    } finally {
      setLoading(false);
    }
  };

  const pickAndUpload = async (type) => {
    setUploadingType(type);
    setUploadError(null);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4,3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      try {
        const userId = global.user?.id;
        const formData = new FormData();
        formData.append(type, {
          uri: result.assets[0].uri,
          name: `${type}.jpg`,
          type: 'image/jpeg',
        });
        await apiService.request(`/drivers/${userId}/documents`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        }, `Failed to upload ${type}. Please try again.`);
        setUploadError(null);
        Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
        fetchStatus();
      } catch (e) {
        setUploadError(`Failed to upload ${type}. Please try again.`);
        setError(`Failed to upload ${type}. Please try again.`);
      } finally {
        setUploadingType(null);
      }
    } else {
      setUploadingType(null);
    }
  };

  const renderStep = (label, idx) => (
    <View key={label} style={[styles.step, step > idx+1 && styles.stepDone, step === idx+1 && styles.stepActive]}>
      <Text style={styles.stepNum}>{idx+1}</Text>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2196F3" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Driver Verification</Text>
      <View style={styles.stepper}>{STEPS.map(renderStep)}</View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusBadge, status?.verification_status === 'verified' ? styles.verified : status?.verification_status === 'rejected' ? styles.rejected : styles.pending]}>
          {status?.verification_status?.toUpperCase() || 'PENDING'}
        </Text>
      </View>
      {status?.verification_reason && (
        <Text style={styles.reasonText}>Reason: {status.verification_reason}</Text>
      )}
      <View style={styles.docsSection}>
        {['license', 'registration', 'insurance'].map((type) => (
          <View key={type} style={styles.docRow}>
            <Text style={styles.docLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickAndUpload(type)} disabled={uploadingType === type}>
              {uploadingType === type ? <ActivityIndicator size="small" color="#2196F3" /> : <Ionicons name="cloud-upload" size={20} color="#2196F3" />}
              <Text style={styles.uploadText}>{docs[type] ? 'Re-upload' : 'Upload'}</Text>
            </TouchableOpacity>
            {docs[type] && (
              <Image source={{ uri: docs[type].startsWith('http') ? docs[type] : `${apiService.baseURL.replace('/api','')}${docs[type]}` }} style={styles.docPreview} />
            )}
            {uploadError && uploadError.includes(type) && <Text style={{ color: 'red', margin: 8 }}>{uploadError}</Text>}
          </View>
        ))}
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Background Check:</Text>
        <Text style={[styles.statusBadge, status?.background_check_status === 'approved' ? styles.verified : status?.background_check_status === 'rejected' ? styles.rejected : styles.pending]}>
          {status?.background_check_status?.toUpperCase() || 'PENDING'}
        </Text>
      </View>
      {step === 4 && (
        <View style={styles.completeBox}>
          <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
          <Text style={styles.completeText}>You are fully verified and ready to drive!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 18,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  step: {
    alignItems: 'center',
    marginHorizontal: 8,
    opacity: 0.5,
  },
  stepActive: {
    opacity: 1,
  },
  stepDone: {
    opacity: 0.8,
  },
  stepNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  verified: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
  },
  rejected: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  pending: {
    backgroundColor: '#FFFDE7',
    color: '#FBC02D',
  },
  reasonText: {
    color: '#D32F2F',
    fontSize: 13,
    marginBottom: 8,
  },
  docsSection: {
    width: '100%',
    marginVertical: 16,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  docLabel: {
    width: 90,
    fontSize: 15,
    fontWeight: '600',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
  },
  uploadText: {
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 4,
  },
  docPreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  completeBox: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  completeText: {
    color: '#388E3C',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
}); 