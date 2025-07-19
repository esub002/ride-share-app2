const express = require('express');
const router = express.Router();

// In-memory storage references (shared with driver routes)
const driverData = new Map();
const earningsData = new Map();
const locationData = new Map();
const rideRequests = new Map();
const driverStats = new Map();

// Get admin dashboard overview
router.get('/dashboard', (req, res) => {
  try {
    const allDrivers = Array.from(driverData.values());
    const onlineDrivers = allDrivers.filter(driver => driver.available);
    const activeRides = Array.from(rideRequests.values()).filter(ride => ride.status === 'active');
    const totalEarnings = allDrivers.reduce((sum, driver) => sum + (driver.totalEarnings || 0), 0);

    res.json({
      stats: {
        totalDrivers: allDrivers.length,
        onlineDrivers: onlineDrivers.length,
        activeRides: activeRides.length,
        totalEarnings: totalEarnings
      },
      recentActivity: {
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get all drivers with detailed information
router.get('/drivers', (req, res) => {
  try {
    const drivers = Array.from(driverData.entries()).map(([driverId, driver]) => {
      const earnings = earningsData.get(driverId);
      const location = locationData.get(driverId);
      const stats = driverStats.get(driverId);

      return {
        id: driverId,
        name: driver.name || 'Unknown Driver',
        email: driver.email || 'No email',
        phone: driver.phone || 'No phone',
        car: driver.car || 'Unknown vehicle',
        rating: driver.rating || 0,
        totalRides: driver.totalRides || 0,
        totalEarnings: driver.totalEarnings || 0,
        available: driver.available || false,
        location: location,
        earnings: earnings,
        stats: stats,
        lastActive: location?.timestamp || new Date().toISOString()
      };
    });

    res.json(drivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

// Get all ride requests
router.get('/rides', (req, res) => {
  try {
    const rides = Array.from(rideRequests.values());
    res.json(rides);
  } catch (error) {
    console.error('Error getting rides:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
});

// Get driver details by ID
router.get('/drivers/:driverId', (req, res) => {
  try {
    const driverId = req.params.driverId;
    const driver = driverData.get(driverId);
    const earnings = earningsData.get(driverId);
    const location = locationData.get(driverId);
    const stats = driverStats.get(driverId);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverDetails = {
      id: driverId,
      name: driver.name || 'Unknown Driver',
      email: driver.email || 'No email',
      phone: driver.phone || 'No phone',
      car: driver.car || 'Unknown vehicle',
      rating: driver.rating || 0,
      totalRides: driver.totalRides || 0,
      totalEarnings: driver.totalEarnings || 0,
      available: driver.available || false,
      location: location,
      earnings: earnings,
      stats: stats,
      lastActive: location?.timestamp || new Date().toISOString()
    };

    res.json(driverDetails);
  } catch (error) {
    console.error('Error getting driver details:', error);
    res.status(500).json({ error: 'Failed to get driver details' });
  }
});

// Get ride details by ID
router.get('/rides/:rideId', (req, res) => {
  try {
    const rideId = parseInt(req.params.rideId);
    const ride = rideRequests.get(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Error getting ride details:', error);
    res.status(500).json({ error: 'Failed to get ride details' });
  }
});

// Update driver status (admin can force driver offline/online)
router.patch('/drivers/:driverId/status', (req, res) => {
  try {
    const driverId = req.params.driverId;
    const { available } = req.body;

    const driver = driverData.get(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.available = available;
    driverData.set(driverId, driver);

    res.json({ success: true, driver });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ error: 'Failed to update driver status' });
  }
});

// Get system statistics
router.get('/stats', (req, res) => {
  try {
    const allDrivers = Array.from(driverData.values());
    const allRides = Array.from(rideRequests.values());
    
    const stats = {
      drivers: {
        total: allDrivers.length,
        online: allDrivers.filter(d => d.available).length,
        offline: allDrivers.filter(d => !d.available).length,
        averageRating: allDrivers.length > 0 ? 
          allDrivers.reduce((sum, d) => sum + (d.rating || 0), 0) / allDrivers.length : 0
      },
      rides: {
        total: allRides.length,
        requested: allRides.filter(r => r.status === 'requested').length,
        active: allRides.filter(r => r.status === 'active').length,
        completed: allRides.filter(r => r.status === 'completed').length,
        cancelled: allRides.filter(r => r.status === 'cancelled').length
      },
      earnings: {
        total: allDrivers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0),
        today: allDrivers.reduce((sum, d) => {
          const earnings = earningsData.get(d.id);
          return sum + (earnings?.today || 0);
        }, 0),
        thisWeek: allDrivers.reduce((sum, d) => {
          const earnings = earningsData.get(d.id);
          return sum + (earnings?.week || 0);
        }, 0)
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ error: 'Failed to get system stats' });
  }
});

// Get real-time data for admin dashboard
router.get('/realtime', (req, res) => {
  try {
    const allDrivers = Array.from(driverData.values());
    const allRides = Array.from(rideRequests.values());
    
    const realtimeData = {
      timestamp: new Date().toISOString(),
      drivers: {
        total: allDrivers.length,
        online: allDrivers.filter(d => d.available).length,
        locations: Array.from(locationData.entries()).map(([driverId, location]) => ({
          driverId,
          location
        }))
      },
      rides: {
        total: allRides.length,
        requested: allRides.filter(r => r.status === 'requested').length,
        active: allRides.filter(r => r.status === 'active').length,
        recent: allRides.filter(r => {
          const createdAt = new Date(r.created_at);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return createdAt > oneHourAgo;
        })
      }
    };

    res.json(realtimeData);
  } catch (error) {
    console.error('Error getting real-time data:', error);
    res.status(500).json({ error: 'Failed to get real-time data' });
  }
});

module.exports = router; 