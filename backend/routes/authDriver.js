const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/driver-profiles/'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `driver_${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// --- Driver Onboarding & Verification ---
const docsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/driver-docs/'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `driver_${req.params.id}_${file.fieldname}_${Date.now()}${ext}`);
  }
});
const docsUpload = multer({ storage: docsStorage });

// Placeholder authDriver route
router.get('/', (req, res) => {
  res.json({ message: 'AuthDriver route placeholder' });
});

// Update driver availability (online/offline)
router.patch('/drivers/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { available } = req.body;
  try {
    const result = await db.query(
      'UPDATE drivers SET available = $1 WHERE id = $2 RETURNING id, available',
      [available, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Driver not found' });
    // Emit socket event to all clients (admin dashboard, etc.)
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('driver:availability', { id: Number(id), available });
    }
    res.json({ success: true, driver: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Upload driver profile image
router.post('/drivers/:id/profile-image', upload.single('profileImage'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/uploads/driver-profiles/${req.file.filename}`;
  try {
    await db.query('UPDATE drivers SET profile_image = $1 WHERE id = $2', [imageUrl, id]);
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Upload driver documents
router.post('/drivers/:id/documents', docsUpload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'registration', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
]), async (req, res) => {
  const { id } = req.params;
  const updates = {};
  if (req.files.license) updates.license_image = `/uploads/driver-docs/${req.files.license[0].filename}`;
  if (req.files.registration) updates.registration_image = `/uploads/driver-docs/${req.files.registration[0].filename}`;
  if (req.files.insurance) updates.insurance_image = `/uploads/driver-docs/${req.files.insurance[0].filename}`;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No files uploaded' });
  try {
    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i+1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    await db.query(`UPDATE drivers SET ${setClause} WHERE id = $${values.length}`, values);
    res.json({ success: true, ...updates });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get driver verification status
router.get('/drivers/:id/verification-status', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT verification_status, verification_reason, license_image, registration_image, insurance_image, background_check_status FROM drivers WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Driver not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update driver verification status (admin/automation)
router.patch('/drivers/:id/verification-status', async (req, res) => {
  const { id } = req.params;
  const { verification_status, verification_reason, background_check_status } = req.body;
  const updates = {};
  if (verification_status) updates.verification_status = verification_status;
  if (verification_reason) updates.verification_reason = verification_reason;
  if (background_check_status) updates.background_check_status = background_check_status;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
  try {
    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i+1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    await db.query(`UPDATE drivers SET ${setClause} WHERE id = $${values.length}`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// GET /drivers/profile - return authenticated driver's profile
const auth = require('../middleware/auth'); // adjust path if needed
router.get('/drivers/profile', auth('driver'), async (req, res) => {
  try {
    const driverId = req.user.id;
    const { rows } = await db.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
    if (!rows.length) return res.status(404).json({ error: 'Driver not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router; 