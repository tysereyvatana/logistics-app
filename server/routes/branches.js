// -------------------------------------------------------------------
// FILE: routes/branches.js
// DESCRIPTION: API routes for CRUD operations on company branches with real-time updates.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/branches
// @desc    Get all branches
// @access  Private (Admin, Staff)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const branches = await pool.query('SELECT * FROM branches ORDER BY branch_name');
        res.json(branches.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/branches
// @desc    Create a new branch
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
    const { branch_name, branch_address, branch_phone } = req.body;
    if (!branch_name || !branch_address) {
        return res.status(400).json({ msg: 'Branch name and address are required.' });
    }
    try {
        const newBranch = await pool.query(
            'INSERT INTO branches (branch_name, branch_address, branch_phone) VALUES ($1, $2, $3) RETURNING *',
            [branch_name, branch_address, branch_phone]
        );

        // --- REAL-TIME UPDATE ---
        req.io.to('branches_room').emit('branches_updated');

        res.status(201).json(newBranch.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/branches/:id
// @desc    Update a branch
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { branch_name, branch_address, branch_phone } = req.body;
    if (!branch_name || !branch_address) {
        return res.status(400).json({ msg: 'Branch name and address are required.' });
    }
    try {
        const updatedBranch = await pool.query(
            'UPDATE branches SET branch_name = $1, branch_address = $2, branch_phone = $3 WHERE id = $4 RETURNING *',
            [branch_name, branch_address, branch_phone, id]
        );
        if (updatedBranch.rows.length === 0) {
            return res.status(404).json({ msg: 'Branch not found.' });
        }

        // --- REAL-TIME UPDATE ---
        req.io.to('branches_room').emit('branches_updated');

        res.json(updatedBranch.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/branches/:id
// @desc    Delete a branch
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await pool.query('DELETE FROM branches WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Branch not found.' });
        }

        // --- REAL-TIME UPDATE ---
        req.io.to('branches_room').emit('branches_updated');

        res.json({ msg: 'Branch removed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
