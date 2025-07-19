const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// In-memory storage for real-time data (use Redis in production)
const driverData = new Map();
const earningsData = new Map();
const locationData = new Map();
const rideRequests = new Map();
const driverStats = new Map();

// Get driver profile
router.get('/profile', async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Check if we have stored data for this driver
    if (driverData.has(driverId)) {
      return res.json(driverData.get(driverId));
    }

    // If no stored data, create mock profile
    const mockProfile = {
      id: driverId,
      name: 'John Driver',
      email: 'john.driver@example.com',
      phone: '+1234567890',
      car: 'Toyota Prius 2020',
      rating: 4.8,
      totalEarnings: 15420.5,
      totalRides: 1250,
      verified: true,
      available: true
    };

    // Store the mock data
    driverData.set(driverId, mockProfile);
    
    res.json(mockProfile);
  } catch (error) {
    console.error('Error getting driver profile:', error);
    res.status(500).json({ error: 'Failed to get driver profile' });
  }
});

// Update driver profile
router.put('/profile', async (req, res) => {
  try {
    const driverId = req.user.id;
    const updates = req.body;
    
    // Get current profile or create new one
    const currentProfile = driverData.get(driverId) || {
      id: driverId,
      name: 'John Driver',
      email: 'john.driver@example.com',
      phone: '+1234567890',
      car: 'Toyota Prius 2020',
      rating: 4.8,
      totalEarnings: 15420.5,
      totalRides: 1250,
      verified: true,
      available: true
    };

    // Update profile
    const updatedProfile = { ...currentProfile, ...updates };
    driverData.set(driverId, updatedProfile);
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({ error: 'Failed to update driver profile' });
  }
});

// Get driver earnings
router.get('/earnings', async (req, res) => {
  try {
    const driverId = req.user.id;
    const period = req.query.period || 'week';
    
    // Check if we have stored earnings data
    if (earningsData.has(driverId)) {
      const storedEarnings = earningsData.get(driverId);
      return res.json(storedEarnings);
    }

    // Create mock earnings data
    const mockEarnings = {
      today: 125.50,
      week: 875.25,
      month: 3240.75,
      total: 15420.50,
      pending: 245.80,
      currency: 'USD'
    };

    // Store the earnings data
    earningsData.set(driverId, mockEarnings);
    
    res.json(mockEarnings);
  } catch (error) {
    console.error('Error getting driver earnings:', error);
    res.status(500).json({ error: 'Failed to get driver earnings' });
  }
});

// Update driver earnings
router.post('/earnings', async (req, res) => {
  try {
    const driverId = req.user.id;
    const earningsUpdate = req.body;
    
    // Get current earnings or create new
    const currentEarnings = earningsData.get(driverId) || {
      today: 0,
      week: 0,
      month: 0,
      total: 0,
      pending: 0,
      currency: 'USD'
    };

    // Update earnings
    const updatedEarnings = { ...currentEarnings, ...earningsUpdate };
    earningsData.set(driverId, updatedEarnings);
    
    res.json(updatedEarnings);
  } catch (error) {
    console.error('Error updating driver earnings:', error);
    res.status(500).json({ error: 'Failed to update driver earnings' });
  }
});

// Get current ride
router.get('/current-ride', async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Check if driver has an active ride
    const activeRides = Array.from(rideRequests.values()).filter(ride => 
      ride.driver_id === driverId && ride.status === 'active'
    );
    
    if (activeRides.length > 0) {
      res.json(activeRides[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error getting current ride:', error);
    res.status(500).json({ error: 'Failed to get current ride' });
  }
});

// Update driver location
router.post('/location', async (req, res) => {
  try {
    const driverId = req.user.id;
    const { latitude, longitude, timestamp } = req.body;
    
    const locationUpdate = {
      driver_id: driverId,
      latitude,
      longitude,
      timestamp: timestamp || new Date().toISOString(),
      accuracy: req.body.accuracy || 10
    };

    // Store location data
    locationData.set(driverId, locationUpdate);
    
    // Emit location update to connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('driver_location_update', locationUpdate);
    }
    
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get driver location
router.get('/location/:driverId', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const location = locationData.get(driverId);
    
    if (location) {
      res.json(location);
    } else {
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (error) {
    console.error('Error getting driver location:', error);
    res.status(500).json({ error: 'Failed to get driver location' });
  }
});

// Update driver availability
router.patch('/:driverId/availability', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const { available } = req.body;
    
    // Update driver profile availability
    const currentProfile = driverData.get(driverId);
    if (currentProfile) {
      currentProfile.available = available;
      driverData.set(driverId, currentProfile);
    }
    
    // Emit availability update
    const io = req.app.get('io');
    if (io) {
      io.emit('driver_availability_update', { driver_id: driverId, available });
    }
    
    res.json({ success: true, available });
  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Get driver stats
router.get('/stats', async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Check if we have stored stats
    if (driverStats.has(driverId)) {
      return res.json(driverStats.get(driverId));
    }

    // Create mock stats
    const mockStats = {
      totalRides: 1250,
      rating: 4.8,
      onlineHours: 156,
      acceptanceRate: 94.5,
      totalEarnings: 15420.50,
      thisWeek: 875.25,
      thisMonth: 3240.75
    };

    // Store the stats
    driverStats.set(driverId, mockStats);
    
    res.json(mockStats);
  } catch (error) {
    console.error('Error getting driver stats:', error);
    res.status(500).json({ error: 'Failed to get driver stats' });
  }
});

// Update driver stats
router.post('/stats', async (req, res) => {
  try {
    const driverId = req.user.id;
    const statsUpdate = req.body;
    
    // Get current stats or create new
    const currentStats = driverStats.get(driverId) || {
      totalRides: 0,
      rating: 0,
      onlineHours: 0,
      acceptanceRate: 0,
      totalEarnings: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    // Update stats
    const updatedStats = { ...currentStats, ...statsUpdate };
    driverStats.set(driverId, updatedStats);
    
    res.json(updatedStats);
  } catch (error) {
    console.error('Error updating driver stats:', error);
    res.status(500).json({ error: 'Failed to update driver stats' });
  }
});

// Get available ride requests
router.get('/ride-requests', async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Get all pending ride requests
    const pendingRequests = Array.from(rideRequests.values()).filter(ride => 
      ride.status === 'requested'
    );
    
    res.json(pendingRequests);
  } catch (error) {
    console.error('Error getting ride requests:', error);
    res.status(500).json({ error: 'Failed to get ride requests' });
  }
});

// Accept ride request
router.post('/accept-ride/:rideId', async (req, res) => {
  try {
    const driverId = req.user.id;
    const rideId = req.params.rideId;
    
    const ride = rideRequests.get(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride request not found' });
    }
    
    if (ride.status !== 'requested') {
      return res.status(400).json({ error: 'Ride is no longer available' });
    }
    
    // Update ride status
    ride.driver_id = driverId;
    ride.status = 'active';
    ride.accepted_at = new Date().toISOString();
    rideRequests.set(rideId, ride);
    
    // Emit ride accepted event
    const io = req.app.get('io');
    if (io) {
      io.emit('ride_accepted', { ride_id: rideId, driver_id: driverId });
    }
    
    res.json(ride);
  } catch (error) {
    console.error('Error accepting ride:', error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

// Complete ride
router.post('/complete-ride/:rideId', async (req, res) => {
  try {
    const driverId = req.user.id;
    const rideId = req.params.rideId;
    const { fare, rating } = req.body;
    
    const ride = rideRequests.get(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    if (ride.driver_id !== driverId) {
      return res.status(403).json({ error: 'Not authorized to complete this ride' });
    }
    
    // Update ride status
    ride.status = 'completed';
    ride.completed_at = new Date().toISOString();
    ride.fare = fare || ride.fare;
    ride.rating = rating;
    rideRequests.set(rideId, ride);
    
    // Update driver earnings
    const currentEarnings = earningsData.get(driverId) || {
      today: 0, week: 0, month: 0, total: 0, pending: 0
    };
    
    currentEarnings.today += fare || 0;
    currentEarnings.week += fare || 0;
    currentEarnings.month += fare || 0;
    currentEarnings.total += fare || 0;
    earningsData.set(driverId, currentEarnings);
    
    // Update driver stats
    const currentStats = driverStats.get(driverId) || {
      totalRides: 0, rating: 0, onlineHours: 0, acceptanceRate: 0
    };
    
    currentStats.totalRides += 1;
    if (rating) {
      currentStats.rating = ((currentStats.rating * (currentStats.totalRides - 1)) + rating) / currentStats.totalRides;
    }
    driverStats.set(driverId, currentStats);
    
    // Emit ride completed event
    const io = req.app.get('io');
    if (io) {
      io.emit('ride_completed', { ride_id: rideId, driver_id: driverId, fare });
    }
    
    res.json({ success: true, ride, updatedEarnings: currentEarnings });
  } catch (error) {
    console.error('Error completing ride:', error);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
});

// Get all stored data (for debugging)
router.get('/debug/data', async (req, res) => {
  try {
    const driverId = req.user.id;
    
    res.json({
      driverData: driverData.get(driverId),
      earningsData: earningsData.get(driverId),
      locationData: locationData.get(driverId),
      driverStats: driverStats.get(driverId),
      allRideRequests: Array.from(rideRequests.values()),
      driverRides: Array.from(rideRequests.values()).filter(ride => ride.driver_id === driverId)
    });
  } catch (error) {
    console.error('Error getting debug data:', error);
    res.status(500).json({ error: 'Failed to get debug data' });
  }
});

// Clear all data (for testing)
router.delete('/debug/clear', async (req, res) => {
  try {
    const driverId = req.user.id;
    
    driverData.delete(driverId);
    earningsData.delete(driverId);
    locationData.delete(driverId);
    driverStats.delete(driverId);
    
    res.json({ success: true, message: 'All data cleared for driver' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

module.exports = router; 