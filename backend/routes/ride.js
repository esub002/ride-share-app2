const express = require('express');
const router = express.Router();

// Placeholder ride route
router.get('/', (req, res) => {
  res.json({ message: 'Ride route placeholder' });
});

module.exports = router; 