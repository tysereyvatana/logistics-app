// -------------------------------------------------------------------
// FILE: routes/users.js
// DESCRIPTION: Added real-time events for user updates and deletions.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users with their branch name
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, u.full_name, u.email, u.role, u.created_at,
                b.branch_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            ORDER BY u.created_at DESC
        `;
        const allUsers = await pool.query(query);
        res.json(allUsers.rows);
    } catch (err) {
        console.error("!!! DATABASE ERROR fetching users:", err); 
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/clients
router.get('/clients', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const clientUsers = await pool.query(
            "SELECT id, full_name FROM users WHERE role = 'client' ORDER BY full_name"
        );
        res.json(clientUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/users/:id/role
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role, branch_id } = req.body;

        if (!['admin', 'staff', 'client'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role specified.' });
        }
        if (req.user.id === id) {
            return res.status(400).json({ msg: 'You cannot change your own role.' });
        }

        const finalBranchId = (role === 'staff' || role === 'admin') ? branch_id : null;

        const updatedUser = await pool.query(
            'UPDATE users SET role = $1, branch_id = $2 WHERE id = $3 RETURNING id, full_name, email, role, created_at',
            [role, finalBranchId, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // --- REAL-TIME UPDATE ---
        if (req.io) {
            req.io.to('users_room').emit('users_updated');
        }

        res.json(updatedUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.id === id) {
            return res.status(400).json({ msg: 'You cannot delete your own account.' });
        }
        const deleteOp = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // --- REAL-TIME UPDATE ---
        if (req.io) {
            req.io.to('users_room').emit('users_updated');
        }

        res.json({ msg: 'User removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
