const express = require('express');
const router = express.Router();

// Mock analytics data
router.get('/', (req, res) => {
  res.json({ message: 'Analytics route placeholder' });
});

router.get('/summary', (req, res) => {
  res.json({
    rides: 1200,
    revenue: 35000,
    activeDrivers: 87
  });
});

router.get('/rides', (req, res) => {
  res.json([
    { date: '2024-07-01', count: 40 },
    { date: '2024-07-02', count: 55 },
    { date: '2024-07-03', count: 60 }
  ]);
});

router.get('/revenue', (req, res) => {
  res.json([
    { date: '2024-07-01', amount: 1200 },
    { date: '2024-07-02', amount: 1500 },
    { date: '2024-07-03', amount: 1800 }
  ]);
});

router.get('/active-drivers', (req, res) => {
  res.json([
    { date: '2024-07-01', count: 30 },
    { date: '2024-07-02', count: 35 },
    { date: '2024-07-03', count: 40 }
  ]);
});

module.exports = router; 