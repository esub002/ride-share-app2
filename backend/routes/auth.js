const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const { v4: uuidv4 } = require('uuid');
const db = require('../db');
// const twilio = require('twilio');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
// const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
// const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
// const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
// const twilioClient = null; // (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

// In-memory admin store (replace with database in production)
let admins = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // hashed 'password123'
    phone: '+1234567890',
    role: 'admin',
    verified: true
  }
];

function generateOTP() {
  return ('' + Math.floor(100000 + Math.random() * 900000)).substring(0, 6);
}

function issueJWT(user, role) {
  return jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '7d' });
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- Admin Authentication Endpoints ---
router.post('/admin/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if admin already exists
  const existingAdmin = admins.find(admin => admin.email === email);
  if (existingAdmin) {
    return res.status(400).json({ error: 'Admin with this email already exists' });
  }

  // Create new admin
  const newAdmin = {
    id: admins.length + 1,
    name,
    email,
    password: hashPassword(password),
    phone,
    role: 'admin',
    verified: true,
    createdAt: new Date()
  };

  admins.push(newAdmin);

  res.json({ 
    message: 'Admin account created successfully',
    admin: {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role
    }
  });
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find admin by email
  const admin = admins.find(a => a.email === email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const hashedPassword = hashPassword(password);
  console.log('Login attempt:', { email, hashedPassword, storedPassword: admin.password });
  
  if (admin.password !== hashedPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = issueJWT(admin, 'admin');

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  });
});

// --- Rider Endpoints ---
router.post('/register', async (req, res) => {
  const { phone, name, email, profile_picture } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const createdAt = new Date();
  if (process.env.NODE_ENV === 'production' && twilioClient && TWILIO_VERIFY_SERVICE_SID) {
    try {
      // Upsert user with new fields
      await db.query(
        'INSERT INTO riders (id, phone, name, email, profile_picture, created_at, verified, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (phone) DO UPDATE SET name = $3, email = $4, profile_picture = $5, status = $8',
        [id, phone, name, email, profile_picture, createdAt, false, 'pending']
      );
      await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: 'sms' });
      res.json({ message: 'OTP sent' });
    } catch (err) {
      res.status(500).json({ error: 'Twilio Verify error', details: err.message });
    }
  } else {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    try {
      await db.query(
        'INSERT INTO riders (id, phone, name, email, profile_picture, created_at, verified, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (phone) DO UPDATE SET name = $3, email = $4, profile_picture = $5, status = $8',
        [id, phone, name, email, profile_picture, createdAt, false, 'pending']
      );
      await db.query(
        'INSERT INTO otps (phone, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $3',
        [phone, otp, expiresAt]
      );
      res.json({ message: 'OTP sent', otp });
    } catch (err) {
      res.status(500).json({ error: 'DB or SMS error', details: err.message });
    }
  }
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  if (process.env.NODE_ENV === 'production' && twilioClient && TWILIO_VERIFY_SERVICE_SID) {
    try {
      // Check OTP via Twilio Verify
      const verification = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: otp });
      if (verification.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      // Mark user as verified
      await db.query('UPDATE riders SET verified = $1, status = $2 WHERE phone = $3', [true, 'verified', phone]);
      const { rows: userRows } = await db.query('SELECT * FROM riders WHERE phone = $1', [phone]);
      const user = userRows[0];
      const token = issueJWT(user, 'rider');
      res.json({ message: 'Verified', token, user });
    } catch (err) {
      res.status(500).json({ error: 'Twilio Verify error', details: err.message });
    }
  } else {
    // Development: use DB OTP logic
    try {
      const { rows: otpRows } = await db.query('SELECT * FROM otps WHERE phone = $1', [phone]);
      if (!otpRows.length) return res.status(400).json({ error: 'OTP not found' });
      const otpRow = otpRows[0];
      if (otpRow.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
      if (new Date() > otpRow.expires_at) return res.status(400).json({ error: 'OTP expired' });
      await db.query('UPDATE riders SET verified = $1, status = $2 WHERE phone = $3', [true, 'verified', phone]);
      await db.query('DELETE FROM otps WHERE phone = $1', [phone]);
      const { rows: userRows } = await db.query('SELECT * FROM riders WHERE phone = $1', [phone]);
      const user = userRows[0];
      const token = issueJWT(user, 'rider');
      res.json({ message: 'Verified', token, user });
    } catch (err) {
      res.status(500).json({ error: 'DB error', details: err.message });
    }
  }
});

router.post('/login', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  try {
    const { rows: userRows } = await db.query('SELECT * FROM riders WHERE phone = $1', [phone]);
    if (!userRows.length) return res.status(404).json({ error: 'User not found' });
    const user = userRows[0];
    if (!user.verified) return res.status(403).json({ error: 'User not verified' });
    const token = issueJWT(user, 'rider');
    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// --- Driver Endpoints ---
router.post('/driver/register', async (req, res) => {
  const { phone, firstName, lastName, email, profile_picture, car_info, license_number } = req.body;
  if (!phone || !firstName || !lastName) return res.status(400).json({ error: 'Phone, firstName, and lastName required' });
  const name = `${firstName} ${lastName}`;
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const createdAt = new Date();
  if (process.env.NODE_ENV === 'production' && twilioClient && TWILIO_VERIFY_SERVICE_SID) {
    try {
      await db.query(
        'INSERT INTO drivers (id, phone, first_name, last_name, name, email, profile_picture, car_info, license_number, created_at, verified, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (phone) DO UPDATE SET first_name = $3, last_name = $4, name = $5, email = $6, profile_picture = $7, car_info = $8, license_number = $9, status = $12',
        [id, phone, firstName, lastName, name, email, profile_picture, car_info, license_number, createdAt, false, 'pending']
      );
      await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: 'sms' });
      res.json({ message: 'OTP sent' });
    } catch (err) {
      res.status(500).json({ error: 'Twilio Verify error', details: err.message });
    }
  } else {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    try {
      await db.query(
        'INSERT INTO drivers (id, phone, first_name, last_name, name, email, profile_picture, car_info, license_number, created_at, verified, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (phone) DO UPDATE SET first_name = $3, last_name = $4, name = $5, email = $6, profile_picture = $7, car_info = $8, license_number = $9, status = $12',
        [id, phone, firstName, lastName, name, email, profile_picture, car_info, license_number, createdAt, false, 'pending']
      );
      await db.query(
        'INSERT INTO otps (phone, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $3',
        [phone, otp, expiresAt]
      );
      res.json({ message: 'OTP sent', otp });
    } catch (err) {
      res.status(500).json({ error: 'DB or SMS error', details: err.message });
    }
  }
});

router.post('/driver/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  if (process.env.NODE_ENV === 'production' && twilioClient && TWILIO_VERIFY_SERVICE_SID) {
    try {
      const verification = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: otp });
      if (verification.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      await db.query('UPDATE drivers SET verified = $1, status = $2 WHERE phone = $3', [true, 'verified', phone]);
      const { rows: driverRows } = await db.query('SELECT * FROM drivers WHERE phone = $1', [phone]);
      const driver = driverRows[0];
      if (driver) {
        driver.firstName = driver.first_name || (driver.name ? driver.name.split(' ')[0] : '');
        driver.lastName = driver.last_name || (driver.name ? driver.name.split(' ').slice(1).join(' ') : '');
      }
      const token = issueJWT(driver, 'driver');
      res.json({ message: 'Verified', token, driver });
    } catch (err) {
      res.status(500).json({ error: 'Twilio Verify error', details: err.message });
    }
  } else {
    try {
      const { rows: otpRows } = await db.query('SELECT * FROM otps WHERE phone = $1', [phone]);
      if (!otpRows.length) return res.status(400).json({ error: 'OTP not found' });
      const otpRow = otpRows[0];
      if (otpRow.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
      if (new Date() > otpRow.expires_at) return res.status(400).json({ error: 'OTP expired' });
      await db.query('UPDATE drivers SET verified = $1, status = $2 WHERE phone = $3', [true, 'verified', phone]);
      await db.query('DELETE FROM otps WHERE phone = $1', [phone]);
      const { rows: driverRows } = await db.query('SELECT * FROM drivers WHERE phone = $1', [phone]);
      const driver = driverRows[0];
      if (driver) {
        driver.firstName = driver.first_name || (driver.name ? driver.name.split(' ')[0] : '');
        driver.lastName = driver.last_name || (driver.name ? driver.name.split(' ').slice(1).join(' ') : '');
      }
      const token = issueJWT(driver, 'driver');
      res.json({ message: 'Verified', token, driver });
    } catch (err) {
      res.status(500).json({ error: 'DB error', details: err.message });
    }
  }
});

router.post('/driver/login', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  try {
    const { rows: driverRows } = await db.query('SELECT * FROM drivers WHERE phone = $1', [phone]);
    if (!driverRows.length) return res.status(404).json({ error: 'Driver not found' });
    const driver = driverRows[0];
    if (!driver.verified) return res.status(403).json({ error: 'Driver not verified' });
    if (driver) {
      driver.firstName = driver.first_name || (driver.name ? driver.name.split(' ')[0] : '');
      driver.lastName = driver.last_name || (driver.name ? driver.name.split(' ').slice(1).join(' ') : '');
    }
    const token = issueJWT(driver, 'driver');
    res.json({ message: 'Login successful', token, driver });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

module.exports = router; 