const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { randomUUID } = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// --- Login a user ---
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email.'),
    body('password').not().isEmpty().withMessage('Password is required.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const oldSessionId = user.active_session_id;
      const newSessionId = randomUUID();
      
      const io = req.app.get('socketio');
      if (oldSessionId && io) {
        io.to(`session_${oldSessionId}`).emit('force_logout', {
          msg: 'This account has been logged in from another device. This session has been terminated.'
        });
      }

      await pool.query('UPDATE users SET active_session_id = $1 WHERE id = $2', [newSessionId, user.id]);

      const payload = {
        user: {
          id: user.id,
          role: user.role,
          sessionId: newSessionId
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token }); // Only return the token
        }
      );
    } catch (err) {
      next(err); // Pass error to the global error handler
    }
  }
);

// --- Get current user data ---
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const userResult = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(userResult.rows[0]);
    } catch (err) {
        next(err);
    }
});


// --- Logout a user ---
router.post('/logout', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        await pool.query('UPDATE users SET active_session_id = NULL WHERE id = $1', [userId]);
        res.status(200).json({ msg: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
});

// --- Register a new user ---
router.post(
  '/register',
  [
    body('fullName').not().isEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Please provide a valid email.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, role = 'client', branch_id } = req.body;
    
    try {
      const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ msg: 'User with that email already exists' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const finalBranchId = (role === 'staff' || role === 'admin') ? branch_id : null;
      
      const newUser = await pool.query(
        'INSERT INTO users (full_name, email, password_hash, role, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
        [fullName, email, passwordHash, role, finalBranchId]
      );

      const io = req.app.get('socketio');
      if (io) {
          io.to('users_room').emit('users_updated');
      }

      res.status(201).json({ msg: 'User registered successfully!', user: newUser.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);


module.exports = router;
