const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// Driver verification endpoints
router.post('/verify-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate OTP for phone verification
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store OTP in database (in production, send via SMS)
    await db.query(
      'INSERT INTO driver_verifications (phone, otp, type, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'10 minutes\')',
      [phone, otp, 'phone_verification']
    );

    // In production, integrate with SMS service
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      verificationId: `phone_${Date.now()}`,
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: 'Phone verification failed' });
  }
});

router.post('/verify-ssn', async (req, res) => {
  try {
    const { ssn } = req.body;
    
    if (!ssn || ssn.length !== 9) {
      return res.status(400).json({ error: 'Valid 9-digit SSN is required' });
    }

    // In production, integrate with background check service
    // For now, simulate background check
    const backgroundCheck = await simulateBackgroundCheck(ssn);

    if (backgroundCheck.status === 'failed') {
      return res.status(400).json({ 
        error: 'Background check failed',
        details: backgroundCheck.reason 
      });
    }

    // Store verification result
    await db.query(
      'INSERT INTO driver_verifications (ssn, verification_data, type, status) VALUES ($1, $2, $3, $4)',
      [ssn, JSON.stringify(backgroundCheck), 'ssn_verification', 'completed']
    );

    res.json({
      success: true,
      message: 'SSN verification successful',
      backgroundCheck,
    });
  } catch (error) {
    console.error('SSN verification error:', error);
    res.status(500).json({ error: 'SSN verification failed' });
  }
});

router.post('/verify-license', async (req, res) => {
  try {
    const { licenseNumber, state } = req.body;
    
    if (!licenseNumber || !state) {
      return res.status(400).json({ error: 'License number and state are required' });
    }

    // In production, integrate with DMV API
    const licenseVerification = await simulateLicenseVerification(licenseNumber, state);

    if (!licenseVerification.valid) {
      return res.status(400).json({ 
        error: 'License verification failed',
        details: licenseVerification.reason 
      });
    }

    // Store verification result
    await db.query(
      'INSERT INTO driver_verifications (license_number, state, verification_data, type, status) VALUES ($1, $2, $3, $4, $5)',
      [licenseNumber, state, JSON.stringify(licenseVerification), 'license_verification', 'completed']
    );

    res.json({
      success: true,
      message: 'License verification successful',
      licenseInfo: licenseVerification,
    });
  } catch (error) {
    console.error('License verification error:', error);
    res.status(500).json({ error: 'License verification failed' });
  }
});

router.post('/verify-insurance', async (req, res) => {
  try {
    const { insuranceNumber, insuranceExpiry, provider } = req.body;
    
    if (!insuranceNumber || !insuranceExpiry) {
      return res.status(400).json({ error: 'Insurance number and expiry date are required' });
    }

    // Check if insurance is expired
    const expiryDate = new Date(insuranceExpiry);
    const today = new Date();
    
    if (expiryDate < today) {
      return res.status(400).json({ 
        error: 'Insurance has expired',
        details: 'Please provide valid insurance information' 
      });
    }

    // In production, integrate with insurance verification service
    const insuranceVerification = await simulateInsuranceVerification(insuranceNumber, provider);

    // Store verification result
    await db.query(
      'INSERT INTO driver_verifications (insurance_number, insurance_expiry, verification_data, type, status) VALUES ($1, $2, $3, $4, $5)',
      [insuranceNumber, insuranceExpiry, JSON.stringify(insuranceVerification), 'insurance_verification', 'completed']
    );

    res.json({
      success: true,
      message: 'Insurance verification successful',
      insuranceInfo: insuranceVerification,
    });
  } catch (error) {
    console.error('Insurance verification error:', error);
    res.status(500).json({ error: 'Insurance verification failed' });
  }
});

router.post('/background-check', async (req, res) => {
  try {
    const { ssn, licenseNumber, firstName, lastName, dateOfBirth } = req.body;
    
    if (!ssn || !licenseNumber) {
      return res.status(400).json({ error: 'SSN and license number are required for background check' });
    }

    // Comprehensive background check
    const backgroundCheck = await performComprehensiveBackgroundCheck({
      ssn,
      licenseNumber,
      firstName,
      lastName,
      dateOfBirth,
    });

    if (backgroundCheck.status === 'failed') {
      return res.status(400).json({ 
        error: 'Background check failed',
        details: backgroundCheck.reason 
      });
    }

    // Store background check result
    await db.query(
      'INSERT INTO driver_verifications (ssn, license_number, verification_data, type, status) VALUES ($1, $2, $3, $4, $5)',
      [ssn, licenseNumber, JSON.stringify(backgroundCheck), 'background_check', 'completed']
    );

    res.json({
      success: true,
      message: 'Background check completed',
      backgroundCheck,
    });
  } catch (error) {
    console.error('Background check error:', error);
    res.status(500).json({ error: 'Background check failed' });
  }
});

router.post('/create-profile', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      ssn,
      licenseNumber,
      vehicleInfo,
      documents
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if driver already exists
    const existingDriver = await db.query(
      'SELECT id FROM drivers WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingDriver.rows.length > 0) {
      return res.status(400).json({ error: 'Driver already exists with this email or phone' });
    }

    // Create driver profile
    const driverResult = await db.query(
      `INSERT INTO drivers (
        first_name, last_name, email, phone, date_of_birth, address,
        ssn, license_number, vehicle_info, documents, verification_status,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id`,
      [
        firstName, lastName, email, phone, dateOfBirth, address,
        ssn, licenseNumber, JSON.stringify(vehicleInfo), JSON.stringify(documents),
        'verified', 'active'
      ]
    );

    const driverId = driverResult.rows[0].id;

    // Generate JWT token
    const token = jwt.sign(
      { 
        driverId, 
        email, 
        type: 'driver',
        verificationStatus: 'verified'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Driver profile created successfully',
      driverId,
      token,
      profile: {
        id: driverId,
        firstName,
        lastName,
        email,
        phone,
        verificationStatus: 'verified',
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Profile creation failed' });
  }
});

router.get('/:driverId/verification-status', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await db.query(
      'SELECT verification_status, verification_data FROM drivers WHERE id = $1',
      [driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driver = result.rows[0];
    const verificationData = driver.verification_data || {};

    res.json({
      success: true,
      verificationStatus: driver.verification_status,
      verificationData,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

router.post('/:driverId/upload-document', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { documentType, documentData } = req.body;

    // In production, upload to cloud storage (AWS S3, etc.)
    const documentUrl = await uploadDocumentToStorage(documentData);

    // Store document reference in database
    await db.query(
      'UPDATE drivers SET documents = jsonb_set(COALESCE(documents, \'{}\'), $1, $2) WHERE id = $3',
      [`{${documentType}}`, JSON.stringify({
        url: documentUrl,
        uploadedAt: new Date().toISOString(),
        type: documentType,
      }), driverId]
    );

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      documentUrl,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Document upload failed' });
  }
});

// Helper functions for simulation
async function simulateBackgroundCheck(ssn) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate background check results
  const random = Math.random();
  
  if (random < 0.1) {
    return {
      status: 'failed',
      reason: 'Criminal record found',
      criminalRecord: 'failed',
      drivingRecord: 'clean',
    };
  }

  return {
    status: 'passed',
    criminalRecord: 'clean',
    drivingRecord: 'clean',
    drugTest: 'passed',
    medicalCheck: 'passed',
    references: 'verified',
  };
}

async function simulateLicenseVerification(licenseNumber, state) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const random = Math.random();
  
  if (random < 0.05) {
    return {
      valid: false,
      reason: 'License suspended',
    };
  }

  return {
    valid: true,
    number: licenseNumber,
    state,
    expiryDate: '2025-12-31',
    status: 'valid',
    restrictions: [],
  };
}

async function simulateInsuranceVerification(insuranceNumber, provider) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    valid: true,
    policyNumber: insuranceNumber,
    provider: provider || 'State Farm',
    coverage: 'comprehensive',
    limits: {
      liability: '$100,000',
      property: '$50,000',
    },
  };
}

async function performComprehensiveBackgroundCheck(driverData) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const random = Math.random();
  
  if (random < 0.05) {
    return {
      status: 'failed',
      reason: 'Multiple traffic violations',
      criminalRecord: 'clean',
      drivingRecord: 'failed',
      drugTest: 'passed',
      medicalCheck: 'passed',
    };
  }

  return {
    status: 'passed',
    criminalRecord: 'clean',
    drivingRecord: 'clean',
    drugTest: 'passed',
    medicalCheck: 'passed',
    references: 'verified',
    creditCheck: 'passed',
    employmentHistory: 'verified',
  };
}

async function uploadDocumentToStorage(documentData) {
  // In production, upload to cloud storage
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return `https://storage.example.com/documents/${Date.now()}_${documentData.fileName}`;
}

module.exports = router; 