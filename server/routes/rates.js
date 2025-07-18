// -------------------------------------------------------------------
// FILE: routes/rates.js
// DESCRIPTION: API routes for CRUD operations on service_rates.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/rates
// @desc    Get all service rates
// @access  Private (Admin, Staff) - Staff need this for dropdowns
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const rates = await pool.query('SELECT * FROM service_rates ORDER BY base_rate');
        res.json(rates.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/rates
// @desc    Create a new service rate
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
    const { service_name, base_rate } = req.body;
    if (!service_name || !base_rate) {
        return res.status(400).json({ msg: 'Service name and base rate are required.' });
    }
    try {
        const newRate = await pool.query(
            'INSERT INTO service_rates (service_name, base_rate) VALUES ($1, $2) RETURNING *',
            [service_name, base_rate]
        );
        res.status(201).json(newRate.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/rates/:id
// @desc    Update a service rate
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { service_name, base_rate } = req.body;
    if (!service_name || !base_rate) {
        return res.status(400).json({ msg: 'Service name and base rate are required.' });
    }
    try {
        const updatedRate = await pool.query(
            'UPDATE service_rates SET service_name = $1, base_rate = $2 WHERE id = $3 RETURNING *',
            [service_name, base_rate, id]
        );
        if (updatedRate.rows.length === 0) {
            return res.status(404).json({ msg: 'Rate not found.' });
        }
        res.json(updatedRate.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/rates/:id
// @desc    Delete a service rate
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await pool.query('DELETE FROM service_rates WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Rate not found.' });
        }
        res.json({ msg: 'Service rate removed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
