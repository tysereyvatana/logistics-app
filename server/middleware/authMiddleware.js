// -------------------------------------------------------------------
// FILE: middleware/authMiddleware.js
// DESCRIPTION: Middleware to protect routes by verifying JWT and checking user roles.
// -------------------------------------------------------------------
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Middleware to verify the JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for the token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database using the id from the token payload
      // and attach it to the request object. Exclude the password hash.
      const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [decoded.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      req.user = result.rows[0];
      next(); // Proceed to the next middleware or the route handler

    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

// Middleware to check for specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `User role '${req.user.role}' is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
