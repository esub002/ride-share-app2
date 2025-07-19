const express = require('express');
const router = express.Router();

// Placeholder authUser route
router.get('/', (req, res) => {
  res.json({ message: 'AuthUser route placeholder' });
});

module.exports = router; 