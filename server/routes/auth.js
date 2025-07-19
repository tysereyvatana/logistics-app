// -------------------------------------------------------------------
// FILE: routes/auth.js
// DESCRIPTION: Added real-time event for user registration.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { randomUUID } = require('crypto');
const { protect } = require('../middleware/authMiddleware');

// --- Login a user ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }
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

        if (oldSessionId && req.io) {
            req.io.to(`session_${oldSessionId}`).emit('force_logout', {
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
                res.json({
                    token,
                    user: {
                        id: user.id,
                        fullName: user.full_name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- Logout a user ---
router.post('/logout', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query('UPDATE users SET active_session_id = NULL WHERE id = $1', [userId]);
        res.status(200).json({ msg: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- Register a new user ---
router.post('/register', async (req, res) => {
  const { fullName, email, password, role = 'client', branch_id } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
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

    // --- REAL-TIME UPDATE ---
    if (req.io) {
        req.io.to('users_room').emit('users_updated');
    }

    res.status(201).json({ msg: 'User registered successfully!', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;
