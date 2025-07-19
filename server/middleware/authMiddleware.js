// -------------------------------------------------------------------
// FILE: middleware/authMiddleware.js
// DESCRIPTION: Middleware now validates the session ID to enforce single-session login.
// -------------------------------------------------------------------
const jwt = require('jsonwebtoken');
const pool = require('../db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user AND their active session ID from the database
      const result = await pool.query(
        'SELECT id, full_name, email, role, active_session_id FROM users WHERE id = $1', 
        [decoded.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      const user = result.rows[0];

      // --- SESSION VALIDATION ---
      // Check if the session ID in the token matches the one in the database.
      if (user.active_session_id !== decoded.user.sessionId) {
        return res.status(401).json({ msg: 'This account has been logged in from another device. This session has been terminated.' });
      }

      // Attach user object to the request (excluding sensitive info)
      req.user = {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      };

      next();

    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `User role '${req.user.role}' is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
