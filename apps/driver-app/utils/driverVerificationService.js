import apiService from './api';

class DriverVerificationService {
  constructor() {
    this.baseURL = apiService.baseURL;
    this.token = apiService.token;
  }

  // Step 1: Phone Verification
  async verifyPhone(phoneNumber) {
    try {
      const response = await apiService.request('/drivers/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber }),
      });
      return response;
    } catch (error) {
      console.error('Phone verification error:', error);
      throw new Error('Phone verification failed');
    }
  }

  // Step 2: SSN Verification with Background Check
  async verifySSN(ssn) {
    try {
      const response = await apiService.request('/drivers/verify-ssn', {
        method: 'POST',
        body: JSON.stringify({ ssn }),
      });
      return response;
    } catch (error) {
      console.error('SSN verification error:', error);
      throw new Error('SSN verification failed');
    }
  }

  // Step 3: Driver's License Verification
  async verifyLicense(licenseNumber, state) {
    try {
      const response = await apiService.request('/drivers/verify-license', {
        method: 'POST',
        body: JSON.stringify({ 
          licenseNumber, 
          state,
          verificationType: 'dmv_check'
        }),
      });
      return response;
    } catch (error) {
      console.error('License verification error:', error);
      throw new Error('License verification failed');
    }
  }

  // Step 4: Insurance Verification
  async verifyInsurance(insuranceData) {
    try {
      const response = await apiService.request('/drivers/verify-insurance', {
        method: 'POST',
        body: JSON.stringify(insuranceData),
      });
      return response;
    } catch (error) {
      console.error('Insurance verification error:', error);
      throw new Error('Insurance verification failed');
    }
  }

  // Step 5: Comprehensive Background Check
  async performBackgroundCheck(driverData) {
    try {
      const response = await apiService.request('/drivers/background-check', {
        method: 'POST',
        body: JSON.stringify(driverData),
      });
      return response;
    } catch (error) {
      console.error('Background check error:', error);
      throw new Error('Background check failed');
    }
  }

  // Step 6: Profile Creation
  async createDriverProfile(profileData) {
    try {
      const response = await apiService.request('/drivers/create-profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
      return response;
    } catch (error) {
      console.error('Profile creation error:', error);
      throw new Error('Profile creation failed');
    }
  }

  // Get verification status
  async getVerificationStatus(driverId) {
    try {
      const response = await apiService.request(`/drivers/${driverId}/verification-status`);
      return response;
    } catch (error) {
      console.error('Get verification status error:', error);
      throw new Error('Failed to get verification status');
    }
  }

  // Upload documents
  async uploadDocument(driverId, documentType, file) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);

      const response = await apiService.request(`/drivers/${driverId}/upload-document`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Document upload error:', error);
      throw new Error('Document upload failed');
    }
  }

  // Mock verification methods for development
  async mockPhoneVerification(phoneNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Phone verification successful',
          verificationId: 'mock_verification_123',
        });
      }, 2000);
    });
  }

  async mockSSNVerification(ssn) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'SSN verification successful',
          backgroundCheck: {
            status: 'passed',
            criminalRecord: 'clean',
            drivingRecord: 'clean',
          },
        });
      }, 3000);
    });
  }

  async mockLicenseVerification(licenseNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'License verification successful',
          licenseInfo: {
            number: licenseNumber,
            state: 'CA',
            expiryDate: '2025-12-31',
            status: 'valid',
          },
        });
      }, 2000);
    });
  }

  async mockInsuranceVerification(insuranceData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Insurance verification successful',
          insuranceInfo: {
            policyNumber: insuranceData.insuranceNumber,
            provider: 'State Farm',
            expiryDate: insuranceData.insuranceExpiry,
            coverage: 'comprehensive',
          },
        });
      }, 2000);
    });
  }

  async mockBackgroundCheck(driverData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Background check completed',
          backgroundCheck: {
            status: 'passed',
            criminalRecord: 'clean',
            drivingRecord: 'clean',
            drugTest: 'passed',
            medicalCheck: 'passed',
            references: 'verified',
          },
        });
      }, 5000);
    });
  }

  async mockProfileCreation(profileData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Profile created successfully',
          driverId: 'driver_' + Date.now(),
          profile: {
            ...profileData,
            status: 'active',
            verificationStatus: 'completed',
            createdAt: new Date().toISOString(),
          },
        });
      }, 2000);
    });
  }

  // Validation methods
  validatePhone(phone) {
    const phoneRegex = /^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
    return phoneRegex.test(phone);
  }

  validateSSN(ssn) {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
  }

  validateLicense(license) {
    return license && license.length >= 8;
  }

  validateInsurance(insuranceData) {
    return insuranceData.insuranceNumber && insuranceData.insuranceExpiry;
  }

  validateProfile(profileData) {
    const requiredFields = ['firstName', 'lastName', 'email', 'dateOfBirth'];
    return requiredFields.every(field => profileData[field]);
  }

  // Format data for API
  formatSSN(ssn) {
    return ssn.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
  }

  formatPhone(phone) {
    return phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  // Get verification requirements
  getVerificationRequirements() {
    return {
      phone: {
        required: true,
        description: 'Phone number for verification',
      },
      ssn: {
        required: true,
        description: 'Social Security Number for background check',
      },
      license: {
        required: true,
        description: 'Valid driver\'s license',
      },
      insurance: {
        required: true,
        description: 'Valid vehicle insurance',
      },
      backgroundCheck: {
        required: true,
        description: 'Comprehensive background check',
      },
      profile: {
        required: true,
        description: 'Complete driver profile',
      },
    };
  }

  // Get verification progress
  getVerificationProgress(verificationStatus) {
    const steps = [
      'phone',
      'ssn',
      'license',
      'insurance',
      'backgroundCheck',
      'profile',
    ];

    const completedSteps = steps.filter(step => verificationStatus[step]);
    const progress = (completedSteps.length / steps.length) * 100;

    return {
      progress,
      completedSteps,
      totalSteps: steps.length,
      remainingSteps: steps.filter(step => !verificationStatus[step]),
    };
  }
}

export default new DriverVerificationService(); 