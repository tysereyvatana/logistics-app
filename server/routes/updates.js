// server/routes/updates.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Add a new update to a shipment
// @route   POST /api/updates
// @access  Private (Admin or Staff)
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  const { shipment_id, location, status_update } = req.body;

  if (!shipment_id || !status_update) {
    return res.status(400).json({ msg: 'Please provide shipment_id and status_update' });
  }

  try {
    // Start a transaction
    await db.query('BEGIN');

    // 1. Insert the new update into the shipment_updates table
    const newUpdateQuery = `
      INSERT INTO shipment_updates (shipment_id, location, status_update) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const newUpdate = await db.query(newUpdateQuery, [shipment_id, location, status_update]);

    // 2. Update the main shipment's status
    const updateShipmentQuery = `
      UPDATE shipments 
      SET status = $1 
      WHERE id = $2 
      RETURNING tracking_number;
    `;
    const updatedShipment = await db.query(updateShipmentQuery, [status_update, shipment_id]);
    
    // Commit the transaction
    await db.query('COMMIT');

    // 3. Emit a real-time event to anyone watching this tracking number
    if (req.io && updatedShipment.rows.length > 0) {
      const trackingNumber = updatedShipment.rows[0].tracking_number;
      // Emit the new update to the specific room for this tracking number
      req.io.to(trackingNumber).emit('new_update', newUpdate.rows[0]);
    }

    res.status(201).json(newUpdate.rows[0]);

  } catch (err) {
    // Rollback in case of an error
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get the update history for a single shipment
// @route   GET /api/updates/:trackingNumber
// @access  Public
router.get('/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const query = `
      SELECT su.* FROM shipment_updates su
      JOIN shipments s ON su.shipment_id = s.id
      WHERE s.tracking_number = $1
      ORDER BY su.timestamp ASC;
    `;
    const { rows } = await db.query(query, [trackingNumber]);

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
