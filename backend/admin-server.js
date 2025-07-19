const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory data stores for admin panel
let admins = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    role: 'admin',
    status: 'active',
    createdAt: new Date()
  }
];

let drivers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Driver',
    name: 'John Driver',
    email: 'john@driver.com',
    phone: '+1234567890',
    status: 'pending',
    vehicle: 'Toyota Camry',
    license: 'DL123456',
    rating: 4.5,
    totalRides: 150,
    earnings: 2500.00,
    createdAt: new Date()
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Driver',
    name: 'Jane Driver',
    email: 'jane@driver.com',
    phone: '+1234567891',
    status: 'active',
    vehicle: 'Honda Civic',
    license: 'DL123457',
    rating: 4.8,
    totalRides: 300,
    earnings: 4500.00,
    createdAt: new Date()
  }
];

let riders = [
  {
    id: 1,
    name: 'Alice Rider',
    email: 'alice@rider.com',
    phone: '+1234567892',
    status: 'active',
    totalRides: 25,
    rating: 4.7,
    createdAt: new Date()
  },
  {
    id: 2,
    name: 'Bob Rider',
    email: 'bob@rider.com',
    phone: '+1234567893',
    status: 'active',
    totalRides: 15,
    rating: 4.9,
    createdAt: new Date()
  }
];

let rides = [
  {
    id: 1,
    riderId: 1,
    driverId: 1,
    status: 'completed',
    pickup: '123 Main St',
    destination: '456 Oak Ave',
    fare: 25.50,
    distance: 5.2,
    duration: 15,
    createdAt: new Date()
  },
  {
    id: 2,
    riderId: 2,
    driverId: 2,
    status: 'in_progress',
    pickup: '789 Pine St',
    destination: '321 Elm St',
    fare: 18.75,
    distance: 3.8,
    duration: 12,
    createdAt: new Date()
  }
];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'admin-backend',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Admin authentication routes
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = admins.find(a => a.email === email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/admin/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const existingAdmin = admins.find(a => a.email === email);
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
      id: admins.length + 1,
      name,
      email,
      password: hashedPassword,
      role,
      status: 'active',
      createdAt: new Date()
    };

    admins.push(newAdmin);

    const token = jwt.sign(
      { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Protected routes
app.use('/api/admin', authenticateToken);

// Dashboard analytics
app.get('/api/admin/dashboard', (req, res) => {
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const pendingDrivers = drivers.filter(d => d.status === 'pending').length;
  const totalRiders = riders.length;
  const totalRides = rides.length;
  const completedRides = rides.filter(r => r.status === 'completed').length;
  const totalEarnings = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, ride) => sum + ride.fare, 0);

  res.json({
    stats: {
      totalDrivers,
      activeDrivers,
      pendingDrivers,
      totalRiders,
      totalRides,
      completedRides,
      totalEarnings: totalEarnings.toFixed(2)
    },
    recentActivity: rides.slice(-5).reverse()
  });
});

// Dashboard stats endpoint (for the main dashboard page)
app.get('/api/admin/stats', (req, res) => {
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const pendingDrivers = drivers.filter(d => d.status === 'pending').length;
  const totalRiders = riders.length;
  const totalRides = rides.length;
  const completedRides = rides.filter(r => r.status === 'completed').length;
  const totalEarnings = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, ride) => sum + ride.fare, 0);
  const activeRides = rides.filter(r => r.status === 'in_progress').length;
  const averageRating = 4.5; // Mock average rating

  res.json({
    totalDrivers,
    activeDrivers,
    pendingDrivers,
    totalRiders,
    totalRides,
    completedRides,
    totalEarnings: totalEarnings.toFixed(2),
    activeRides,
    averageRating
  });
});

// Riders management endpoints
app.get('/api/admin/riders', (req, res) => {
  res.json(riders);
});

app.post('/api/admin/riders/:id/approve', (req, res) => {
  const rider = riders.find(r => r.id == req.params.id);
  if (rider) {
    rider.status = 'active';
    res.json({ success: true, rider });
  } else {
    res.status(404).json({ error: 'Rider not found' });
  }
});

app.post('/api/admin/riders/:id/suspend', (req, res) => {
  const rider = riders.find(r => r.id == req.params.id);
  if (rider) {
    rider.status = 'suspended';
    res.json({ success: true, rider });
  } else {
    res.status(404).json({ error: 'Rider not found' });
  }
});

app.delete('/api/admin/riders/:id', (req, res) => {
  const index = riders.findIndex(r => r.id == req.params.id);
  if (index !== -1) {
    riders.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Rider not found' });
  }
});

// Driver management
app.get('/api/admin/drivers', (req, res) => {
  // Ensure all drivers have firstName and lastName for compatibility
  const driversWithNames = drivers.map(d => ({
    ...d,
    firstName: d.firstName || (d.name ? d.name.split(' ')[0] : ''),
    lastName: d.lastName || (d.name ? d.name.split(' ').slice(1).join(' ') : ''),
  }));
  res.json(driversWithNames);
});

app.post('/api/admin/drivers/:id/approve', (req, res) => {
  const driver = drivers.find(d => d.id == req.params.id);
  if (driver) {
    driver.status = 'active';
    res.json({ success: true, driver });
  } else {
    res.status(404).json({ error: 'Driver not found' });
  }
});

app.post('/api/admin/drivers/:id/suspend', (req, res) => {
  const driver = drivers.find(d => d.id == req.params.id);
  if (driver) {
    driver.status = 'suspended';
    res.json({ success: true, driver });
  } else {
    res.status(404).json({ error: 'Driver not found' });
  }
});

app.delete('/api/admin/drivers/:id', (req, res) => {
  const index = drivers.findIndex(d => d.id == req.params.id);
  if (index !== -1) {
    drivers.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Driver not found' });
  }
});

// Rider management
app.get('/api/admin/riders', (req, res) => {
  res.json(riders);
});

app.post('/api/admin/riders/:id/suspend', (req, res) => {
  const rider = riders.find(r => r.id == req.params.id);
  if (rider) {
    rider.status = 'suspended';
    res.json({ success: true, rider });
  } else {
    res.status(404).json({ error: 'Rider not found' });
  }
});

app.delete('/api/admin/riders/:id', (req, res) => {
  const index = riders.findIndex(r => r.id == req.params.id);
  if (index !== -1) {
    riders.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Rider not found' });
  }
});

// Ride management
app.get('/api/admin/rides', (req, res) => {
  res.json(rides);
});

// Admin management
app.get('/api/admin/admins', (req, res) => {
  const adminList = admins.map(admin => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    createdAt: admin.createdAt
  }));
  res.json(adminList);
});

app.post('/api/admin/admins/:id/role', (req, res) => {
  const admin = admins.find(a => a.id == req.params.id);
  if (admin && req.body.role) {
    admin.role = req.body.role;
    res.json({ success: true, admin });
  } else {
    res.status(404).json({ error: 'Admin not found or role missing' });
  }
});

// Notifications endpoint
app.post('/api/admin/notifications', (req, res) => {
  const { target, message } = req.body;
  if (!target || !message) {
    return res.status(400).json({ error: 'Target and message required' });
  }
  
  // Mock notification sending
  console.log(`Sending notification to ${JSON.stringify(target)}: ${message}`);
  res.json({ success: true, message: 'Notification sent successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Admin Backend running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 