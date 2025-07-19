const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory storage for ride requests and active rides
const rideRequests = new Map();
const activeRides = new Map();
const driverLocations = new Map();
const availableDrivers = new Set();

// Sample data for testing
let rideRequestId = 1;

// Create a new ride request
router.post('/request', (req, res) => {
  try {
    const {
      riderId,
      pickupLocation,
      dropoffLocation,
      rideType = 'standard',
      estimatedFare,
      notes = ''
    } = req.body;

    const rideRequest = {
      id: rideRequestId++,
      riderId,
      pickupLocation,
      dropoffLocation,
      rideType,
      estimatedFare,
      notes,
      status: 'requested',
      createdAt: new Date().toISOString(),
      driverId: null,
      actualFare: null,
      startTime: null,
      endTime: null,
      rating: null,
      feedback: null
    };

    rideRequests.set(rideRequest.id, rideRequest);

    // Emit real-time event for available drivers
    req.app.get('io').emit('newRideRequest', {
      rideRequest,
      message: 'New ride request available'
    });

    res.json({
      success: true,
      rideRequest,
      message: 'Ride request created successfully'
    });

  } catch (error) {
    console.error('Error creating ride request:', error);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
});

// Get nearby available drivers for a ride request
router.get('/request/:requestId/nearby-drivers', (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const rideRequest = rideRequests.get(requestId);

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    const pickupLocation = rideRequest.pickupLocation;
    const nearbyDrivers = [];

    // Find drivers within 5km radius
    availableDrivers.forEach(driverId => {
      const driverLocation = driverLocations.get(driverId);
      if (driverLocation) {
        const distance = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          driverLocation.latitude,
          driverLocation.longitude
        );

        if (distance <= 5) { // 5km radius
          nearbyDrivers.push({
            driverId,
            distance: distance.toFixed(2),
            estimatedArrival: Math.ceil(distance * 2), // 2 minutes per km
            location: driverLocation
          });
        }
      }
    });

    // Sort by distance
    nearbyDrivers.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.json({
      rideRequest,
      nearbyDrivers,
      count: nearbyDrivers.length
    });

  } catch (error) {
    console.error('Error getting nearby drivers:', error);
    res.status(500).json({ error: 'Failed to get nearby drivers' });
  }
});

// Driver accepts a ride request
router.post('/request/:requestId/accept', (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const { driverId } = req.body;

    const rideRequest = rideRequests.get(requestId);
    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    if (rideRequest.status !== 'requested') {
      return res.status(400).json({ error: 'Ride request is no longer available' });
    }

    // Update ride request
    rideRequest.status = 'accepted';
    rideRequest.driverId = driverId;
    rideRequest.acceptedAt = new Date().toISOString();

    // Remove driver from available drivers
    availableDrivers.delete(driverId);

    // Create active ride
    const activeRide = {
      ...rideRequest,
      rideId: `ride_${requestId}`,
      status: 'active',
      startTime: new Date().toISOString()
    };

    activeRides.set(activeRide.rideId, activeRide);

    // Emit real-time events
    const io = req.app.get('io');
    io.emit('rideAccepted', {
      rideRequest,
      driverId,
      message: 'Ride has been accepted'
    });

    io.to(`driver_${driverId}`).emit('rideAssigned', {
      ride: activeRide,
      message: 'You have been assigned a ride'
    });

    io.to(`rider_${rideRequest.riderId}`).emit('driverAssigned', {
      ride: activeRide,
      driverId,
      message: 'A driver has accepted your ride'
    });

    res.json({
      success: true,
      ride: activeRide,
      message: 'Ride accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting ride:', error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

// Update ride status (start, in-progress, completed, cancelled)
router.patch('/ride/:rideId/status', (req, res) => {
  try {
    const { rideId } = req.params;
    const { status, location, notes } = req.body;

    const ride = activeRides.get(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const previousStatus = ride.status;
    ride.status = status;

    switch (status) {
      case 'started':
        ride.startTime = new Date().toISOString();
        break;
      case 'in-progress':
        if (location) {
          ride.currentLocation = location;
        }
        break;
      case 'completed':
        ride.endTime = new Date().toISOString();
        ride.actualFare = req.body.actualFare || ride.estimatedFare;
        // Move to completed rides
        activeRides.delete(rideId);
        break;
      case 'cancelled':
        ride.cancelledAt = new Date().toISOString();
        ride.cancellationReason = req.body.reason || 'Cancelled by user';
        // Return driver to available pool
        if (ride.driverId) {
          availableDrivers.add(ride.driverId);
        }
        activeRides.delete(rideId);
        break;
    }

    // Emit real-time status update
    const io = req.app.get('io');
    io.emit('rideStatusUpdated', {
      rideId,
      status,
      previousStatus,
      ride,
      message: `Ride status updated to ${status}`
    });

    // Notify specific users
    if (ride.riderId) {
      io.to(`rider_${ride.riderId}`).emit('rideUpdate', {
        ride,
        status,
        message: `Your ride is now ${status}`
      });
    }

    if (ride.driverId) {
      io.to(`driver_${ride.driverId}`).emit('rideUpdate', {
        ride,
        status,
        message: `Ride status: ${status}`
      });
    }

    res.json({
      success: true,
      ride,
      message: `Ride status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
});

// Get ride details
router.get('/ride/:rideId', (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = activeRides.get(rideId) || rideRequests.get(parseInt(rideId));

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(ride);

  } catch (error) {
    console.error('Error getting ride details:', error);
    res.status(500).json({ error: 'Failed to get ride details' });
  }
});

// Get all active rides
router.get('/active', (req, res) => {
  try {
    const rides = Array.from(activeRides.values());
    res.json(rides);
  } catch (error) {
    console.error('Error getting active rides:', error);
    res.status(500).json({ error: 'Failed to get active rides' });
  }
});

// Get ride history for a user
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query; // 'rider' or 'driver'

    let rides = [];
    
    // Get from active rides
    activeRides.forEach(ride => {
      if (userType === 'rider' && ride.riderId === userId) {
        rides.push(ride);
      } else if (userType === 'driver' && ride.driverId === userId) {
        rides.push(ride);
      }
    });

    // Get from ride requests (completed/cancelled)
    rideRequests.forEach(ride => {
      if (ride.status !== 'requested' && ride.status !== 'accepted') {
        if (userType === 'rider' && ride.riderId === userId) {
          rides.push(ride);
        } else if (userType === 'driver' && ride.driverId === userId) {
          rides.push(ride);
        }
      }
    });

    // Sort by creation date (newest first)
    rides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(rides);

  } catch (error) {
    console.error('Error getting ride history:', error);
    res.status(500).json({ error: 'Failed to get ride history' });
  }
});

// Rate a completed ride
router.post('/ride/:rideId/rate', (req, res) => {
  try {
    const { rideId } = req.params;
    const { rating, feedback, ratedBy } = req.body; // 'rider' or 'driver'

    const ride = activeRides.get(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ratedBy === 'rider') {
      ride.riderRating = rating;
      ride.riderFeedback = feedback;
    } else if (ratedBy === 'driver') {
      ride.driverRating = rating;
      ride.driverFeedback = feedback;
    }

    res.json({
      success: true,
      ride,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Error rating ride:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Update driver location
router.post('/driver/:driverId/location', (req, res) => {
  try {
    const { driverId } = req.params;
    const { latitude, longitude, timestamp } = req.body;

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp || new Date().toISOString()
    };

    driverLocations.set(driverId, location);

    // Emit location update to connected clients
    req.app.get('io').emit('driverLocationUpdate', {
      driverId,
      location
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Update driver availability
router.post('/driver/:driverId/availability', (req, res) => {
  try {
    const { driverId } = req.params;
    const { available } = req.body;

    if (available) {
      availableDrivers.add(driverId);
    } else {
      availableDrivers.delete(driverId);
    }

    // Emit availability update
    req.app.get('io').emit('driverAvailabilityUpdate', {
      driverId,
      available
    });

    res.json({
      success: true,
      available,
      message: `Driver ${available ? 'online' : 'offline'}`
    });

  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Get available drivers count
router.get('/drivers/available', (req, res) => {
  try {
    const count = availableDrivers.size;
    const drivers = Array.from(availableDrivers).map(driverId => ({
      driverId,
      location: driverLocations.get(driverId)
    }));

    res.json({
      count,
      drivers
    });

  } catch (error) {
    console.error('Error getting available drivers:', error);
    res.status(500).json({ error: 'Failed to get available drivers' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Debug endpoint to get all data
router.get('/debug/all', (req, res) => {
  res.json({
    rideRequests: Array.from(rideRequests.entries()),
    activeRides: Array.from(activeRides.entries()),
    availableDrivers: Array.from(availableDrivers),
    driverLocations: Array.from(driverLocations.entries())
  });
});

module.exports = router; 