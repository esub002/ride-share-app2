import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Button from './ui/Button';

export default function DocumentUpload({ 
  onDocumentUpload, 
  requiredDocuments = [],
  uploadedDocuments = {},
  style = {} 
}) {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera and photo library permissions to upload documents.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async (documentType) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleDocumentUpload(documentType, result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (documentType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleDocumentUpload(documentType, result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleDocumentUpload = async (documentType, imageAsset) => {
    setUploading(true);
    try {
      const documentData = {
        type: documentType,
        uri: imageAsset.uri,
        fileName: `${documentType}_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        size: imageAsset.fileSize || 0,
      };

      await onDocumentUpload(documentType, documentData);
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showUploadOptions = (documentType) => {
    Alert.alert(
      'Upload Document',
      'Choose how you want to upload your document',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(documentType),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(documentType),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removeDocument = (documentType) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDocumentUpload(documentType, null),
        },
      ]
    );
  };

  const getDocumentIcon = (documentType) => {
    const icons = {
      'drivers_license': 'card',
      'insurance_card': 'shield-checkmark',
      'vehicle_registration': 'car',
      'profile_photo': 'person',
      'vehicle_photo': 'car-sport',
      'background_check': 'document-text',
    };
    return icons[documentType] || 'document';
  };

  const getDocumentTitle = (documentType) => {
    const titles = {
      'drivers_license': 'Driver\'s License',
      'insurance_card': 'Insurance Card',
      'vehicle_registration': 'Vehicle Registration',
      'profile_photo': 'Profile Photo',
      'vehicle_photo': 'Vehicle Photo',
      'background_check': 'Background Check',
    };
    return titles[documentType] || documentType.replace('_', ' ').toUpperCase();
  };

  const renderDocumentItem = (documentType) => {
    const isUploaded = uploadedDocuments[documentType];
    const isRequired = requiredDocuments.includes(documentType);

    return (
      <View key={documentType} style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Ionicons 
              name={getDocumentIcon(documentType)} 
              size={24} 
              color={isUploaded ? '#4CAF50' : '#72809b'} 
            />
            <View style={styles.documentText}>
              <Text style={styles.documentTitle}>
                {getDocumentTitle(documentType)}
              </Text>
              <Text style={styles.documentStatus}>
                {isUploaded ? 'Uploaded' : isRequired ? 'Required' : 'Optional'}
              </Text>
            </View>
          </View>
          {isRequired && !isUploaded && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}
        </View>

        {isUploaded ? (
          <View style={styles.uploadedDocument}>
            <Image 
              source={{ uri: uploadedDocuments[documentType].uri }} 
              style={styles.documentImage} 
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeDocument(documentType)}
            >
              <Ionicons name="close-circle" size={24} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => showUploadOptions(documentType)}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload" size={24} color="#2196F3" />
            <Text style={styles.uploadText}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Required Documents</Text>
      <Text style={styles.sectionDescription}>
        Please upload clear photos of the following documents for verification
      </Text>

      {requiredDocuments.map(renderDocumentItem)}

      <View style={styles.uploadTips}>
        <Text style={styles.tipsTitle}>Upload Tips:</Text>
        <Text style={styles.tipText}>• Ensure documents are clearly visible</Text>
        <Text style={styles.tipText}>• Take photos in good lighting</Text>
        <Text style={styles.tipText}>• Avoid shadows and glare</Text>
        <Text style={styles.tipText}>• Make sure all text is readable</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#aeb4cf',
    marginBottom: 20,
    lineHeight: 20,
  },
  documentItem: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2e3e',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentText: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  documentStatus: {
    fontSize: 12,
    color: '#72809b',
    marginTop: 2,
  },
  requiredBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  uploadText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadedDocument: {
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
  },
  uploadTips: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#2a2e3e',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#aeb4cf',
    marginBottom: 4,
  },
}); 