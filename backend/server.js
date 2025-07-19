// Load environment variables
require('dotenv').config();

// server.js - Main Express app and Socket.IO server
// Sets up routes, middleware, and real-time events

// Basic Express + Socket.IO backend for ride assignment
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');
const userRoutes = require('./routes/user');
const driverRoutes = require('./routes/driver');
const rideRoutes = require('./routes/ride');
const authUser = require('./routes/authUser');
const authDriver = require('./routes/authDriver');
const auth = require('./middleware/auth');
const morgan = require('morgan');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const safetyRoutes = require('./routes/safety');
const driverVerificationRoutes = require('./routes/driverVerification');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRouter = require('./routes/auth');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Set database pool in app.locals for tests
app.locals.pool = pool;

// Initialize Socket.IO with proper error handling
let io;
try {
  io = new Server(server, {
    cors: { origin: '*' }
  });
  app.set('io', io); // Attach io to app for use in routes
} catch (error) {
  console.error('Socket.IO initialization error:', error);
  io = null;
}

// In-memory stores for development when database is not available
let availableDrivers = {};
let pendingRides = {};
let rideIdCounter = 1;

// Sample ride requests for testing
const sampleRideRequests = [
  {
    id: 1,
    user_id: 1,
    pickup_location: '123 Main St, Chicago, IL',
    destination: '456 Oak Ave, Chicago, IL',
    fare: 25.50,
    notes: 'Please arrive on time',
    status: 'requested',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    driver_id: null,
    accepted_at: null,
    completed_at: null
  },
  {
    id: 2,
    user_id: 2,
    pickup_location: '789 Pine St, Chicago, IL',
    destination: '321 Elm St, Chicago, IL',
    fare: 18.75,
    notes: 'Need wheelchair accessible vehicle',
    status: 'requested',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    driver_id: null,
    accepted_at: null,
    completed_at: null
  },
  {
    id: 3,
    user_id: 3,
    pickup_location: '555 Lake Shore Dr, Chicago, IL',
    destination: '777 Michigan Ave, Chicago, IL',
    fare: 32.00,
    notes: 'Airport pickup',
    status: 'requested',
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
    driver_id: null,
    accepted_at: null,
    completed_at: null
  }
];

// Initialize sample ride requests
sampleRideRequests.forEach(ride => {
  pendingRides[ride.id] = ride;
  rideIdCounter = Math.max(rideIdCounter, ride.id + 1);
});

// Mock data for development
const mockData = {
  users: [
    { id: 1, name: 'Test User', email: 'user@test.com', phone: '+1234567890', verified: true },
    { id: 2, name: 'John Driver', email: 'driver@test.com', phone: '+1234567891', car_info: 'Toyota Prius', verified: true }
  ],
  drivers: [
    { id: 1, name: 'John Driver', email: 'driver@test.com', phone: '+1234567891', car_info: 'Toyota Prius', verified: true, available: true }
  ],
  rides: [
    { id: 1, user_id: 1, driver_id: 1, pickup: '123 Main St', destination: '456 Oak Ave', status: 'completed', fare: 25.50 }
  ]
};

// In-memory OTP store for demo (use Redis or DB in production)
const otpStore = {};

app.use(express.json());
app.use(morgan('combined'));

// Enhanced CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:19006', 'exp://localhost:19000'];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// --- Middleware ---
app.use('/api/auth/user', authUser);
app.use('/api/auth/driver', authDriver);
app.use('/api/users', auth('user'), userRoutes);
app.use('/api/drivers', auth('driver'), driverRoutes);
app.use('/api/rides', auth(), rideRoutes);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/drivers/verification', driverVerificationRoutes);
app.use('/api/notifications', require('./routes/safety'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ride Share API is working',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mode: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: pool ? 'connected' : 'mock'
  });
});

// Development endpoints for testing
if (process.env.NODE_ENV === 'development') {
  app.get('/api/dev/mock-data', (req, res) => {
    res.json(mockData);
  });
  
  app.post('/api/dev/reset', (req, res) => {
    rideIdCounter = 1;
    pendingRides = {};
    availableDrivers = {};
    res.json({ message: 'Mock data reset' });
  });
}

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ride Share App API',
    version: '1.0.0',
    description: 'API documentation for the Ride Share App backend with enhanced safety features.'
  },
  servers: [
    { url: 'http://localhost:3000' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    }
  }
};
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Database connection check with retry logic and fallback
const checkDatabaseConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query('SELECT NOW() as now');
      console.log('✅ Database connected successfully:', result.rows[0].now);
      return true;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        console.log('🔄 Using mock database for development...');
        return false;
      }
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Initialize database connection
checkDatabaseConnection();

// --- Real-time Events ---
if (io) {
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // --- REAL-TIME AUTH EVENTS ---
    // 1. Registration
    socket.on('register', async ({ phone, email, name, role }) => {
      // Save user with pending_verification
      // For demo, just add to mockData
      const userId = mockData.users.length + 1;
      const user = { id: userId, phone, email, name, role, verified: false, status: 'pending_verification' };
      mockData.users.push(user);
      // Generate OTP
      const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
      otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };
      // TODO: Send OTP via SMS/email in production
      console.log(`🔑 OTP for ${phone}: ${otp}`);
      socket.emit('otp_sent', { message: 'OTP sent', phone });
      io.emit('admin:user_registered', { user }); // Admin dashboard event
    });

    // 2. OTP Verification
    socket.on('verify_otp', async ({ phone, otp }) => {
      const record = otpStore[phone];
      const user = mockData.users.find(u => u.phone === phone);
      if (!record || !user) {
        socket.emit('otp_error', { error: 'Invalid phone or OTP' });
        return;
      }
      if (record.otp !== otp) {
        socket.emit('otp_error', { error: 'Incorrect OTP' });
        return;
      }
      if (Date.now() > record.expires) {
        socket.emit('otp_error', { error: 'OTP expired' });
        return;
      }
      user.verified = true;
      user.status = 'verified';
      delete otpStore[phone];
      // Issue JWT
      const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
      socket.emit('verified', { token, user });
      io.emit('admin:user_verified', { user }); // Admin dashboard event
    });

    // 3. Login
    socket.on('login', async ({ phone }) => {
      const user = mockData.users.find(u => u.phone === phone);
      if (!user) {
        socket.emit('login_error', { error: 'User not found' });
        return;
      }
      if (!user.verified) {
        socket.emit('login_error', { error: 'User not verified' });
        return;
      }
      // Issue JWT
      const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
      socket.emit('login_success', { token, user });
      io.emit('admin:user_login', { user }); // Admin dashboard event
    });

    // DRIVER: Mark as available
    socket.on('driver:available', ({ driverId }) => {
      availableDrivers[driverId] = socket.id;
      console.log(`🚗 Driver ${driverId} available: ${socket.id}`);
      
      // Emit current ride requests to the newly available driver
      const pendingRequests = Object.values(pendingRides).filter(ride => ride.status === 'requested');
      if (pendingRequests.length > 0) {
        socket.emit('ride_requests_available', pendingRequests);
      }
    });

    // RIDER: Request a ride
    socket.on('ride:request', ({ origin, destination, riderId, fare, notes }) => {
      const rideRequest = {
        id: rideIdCounter++,
        user_id: riderId,
        pickup_location: origin,
        destination,
        fare: fare || 25.00,
        notes: notes || '',
        status: 'requested',
        created_at: new Date().toISOString(),
        driver_id: null,
        accepted_at: null,
        completed_at: null
      };
      
      // Store the ride request
      pendingRides[rideRequest.id] = rideRequest;
      
      // Notify all available drivers
      const driverIds = Object.keys(availableDrivers);
      if (driverIds.length > 0) {
        driverIds.forEach(driverId => {
          const driverSocketId = availableDrivers[driverId];
          io.to(driverSocketId).emit('new_ride_request', rideRequest);
        });
      }
      
      // Confirm to rider
      socket.emit('ride_request_created', rideRequest);
      console.log(`🚕 New ride request created: ${rideRequest.id}`);
    });

    // DRIVER: Accept ride
    socket.on('ride:accept', ({ rideId, driverId }) => {
      const ride = pendingRides[rideId];
      if (ride && ride.status === 'requested') {
        // Update ride status
        ride.driver_id = driverId;
        ride.status = 'active';
        ride.accepted_at = new Date().toISOString();
        pendingRides[rideId] = ride;
        
        // Notify rider (if connected)
        socket.emit('ride_accepted', { ride_id: rideId, driver_id: driverId });
        io.emit('ride_status_update', { ride_id: rideId, status: 'active', driver_id: driverId });
        console.log(`✅ Ride ${rideId} accepted by driver ${driverId}`);
      }
    });

    // DRIVER: Complete ride
    socket.on('ride:complete', ({ rideId, driverId, fare, rating }) => {
      const ride = pendingRides[rideId];
      if (ride && ride.driver_id == driverId) {
        // Update ride status
        ride.status = 'completed';
        ride.completed_at = new Date().toISOString();
        ride.fare = fare || ride.fare;
        ride.rating = rating;
        pendingRides[rideId] = ride;
        
        // Notify all clients
        io.emit('ride_completed', { ride_id: rideId, driver_id: driverId, fare });
        console.log(`✅ Ride ${rideId} completed by driver ${driverId}`);
      }
    });

    // DRIVER: Update location
    socket.on('driver:location_update', ({ driverId, latitude, longitude, accuracy }) => {
      const locationUpdate = {
        driver_id: driverId,
        latitude,
        longitude,
        accuracy: accuracy || 10,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast location update to all clients
      io.emit('driver_location_update', locationUpdate);
      console.log(`📍 Driver ${driverId} location updated: ${latitude}, ${longitude}`);
    });

    // DRIVER: Update availability
    socket.on('driver:availability_update', ({ driverId, available }) => {
      if (available) {
        availableDrivers[driverId] = socket.id;
      } else {
        delete availableDrivers[driverId];
      }
      
      io.emit('driver_availability_update', { driver_id: driverId, available });
      console.log(`🚗 Driver ${driverId} availability updated: ${available}`);
    });

    // Get current ride requests
    socket.on('get_ride_requests', () => {
      const pendingRequests = Object.values(pendingRides).filter(ride => ride.status === 'requested');
      socket.emit('ride_requests_list', pendingRequests);
    });

    // Get driver's current ride
    socket.on('get_current_ride', ({ driverId }) => {
      const activeRide = Object.values(pendingRides).find(ride => 
        ride.driver_id == driverId && ride.status === 'active'
      );
      socket.emit('current_ride', activeRide || null);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      // Remove driver from available list
      Object.keys(availableDrivers).forEach(driverId => {
        if (availableDrivers[driverId] === socket.id) {
          delete availableDrivers[driverId];
          console.log(`🚗 Driver ${driverId} no longer available`);
        }
      });
    });
  });
}

// Start server with port conflict handling
const startServer = async (initialPort) => {
  const maxPortAttempts = 10;
  let currentPort = initialPort;
  
  for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const serverInstance = server.listen(currentPort, () => {
          console.log(`🚀 Server running on port ${currentPort}`);
          console.log(`📱 Health check: http://localhost:${currentPort}/health`);
          console.log(`🔗 API docs: http://localhost:${currentPort}/api-docs`);
          console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
          resolve();
        });
        
        serverInstance.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${currentPort} is in use, trying ${currentPort + 1}...`);
            currentPort++;
            serverInstance.close();
            reject(error);
          } else {
            reject(error);
          }
        });
      });
      
      // If we get here, the server started successfully
      return;
      
    } catch (error) {
      if (error.code === 'EADDRINUSE' && attempt < maxPortAttempts - 1) {
        // Continue to next port
        continue;
      } else {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
      }
    }
  }
  
  console.error('❌ No available ports found');
  process.exit(1);
};

const PORT = process.env.PORT || 3000;
startServer(parseInt(PORT));

module.exports = app;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production
