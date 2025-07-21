// auth.js - JWT authentication middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// For development: skip authentication for all driver routes
function authMiddleware(role) {
  return (req, res, next) => {
    // If the route is for drivers, skip auth and inject dummy user
    if (role === 'driver') {
      req.user = {
        id: 1,
        name: 'John Driver',
        email: 'john@example.com',
        role: 'driver',
      };
      return next();
    }
    // For other roles (e.g., admin), you can keep the original logic or skip as needed
    // Uncomment below to skip for all roles:
    // req.user = { id: 1, name: 'Dev User', email: 'dev@example.com', role };
    // return next();

    // Default: reject if not driver
    return res.status(401).json({ error: 'Unauthorized (dev skip only for driver)' });
  };
}

// JWT authentication middleware for protected routes
function authenticateToken(req, res, next) {
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
}

module.exports = authMiddleware;
module.exports.authenticateToken = authenticateToken;
