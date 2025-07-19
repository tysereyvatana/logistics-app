// server/routes/updates.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Add a new update to a shipment
// @route   POST /api/updates
// @access  Private (Admin or Staff)
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  const { shipment_id, location, status_update, status } = req.body;

  if (!shipment_id || !status_update || !status) {
    return res.status(400).json({ msg: 'Please provide shipment_id, status, and an update message.' });
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
    const newUpdateResult = await db.query(newUpdateQuery, [shipment_id, location, status_update]);
    const newUpdate = newUpdateResult.rows[0];

    // 2. Update the main shipment's status
    const updateShipmentQuery = `
      UPDATE shipments 
      SET status = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    const updatedShipmentResult = await db.query(updateShipmentQuery, [status, shipment_id]);
    
    if (updatedShipmentResult.rows.length === 0) {
        // If no rows are returned, the shipment doesn't exist. Rollback and throw error.
        await db.query('ROLLBACK');
        return res.status(404).json({ msg: 'Shipment not found for update.' });
    }

    // 3. Fetch the full updated shipment details with branch names for the socket event
    const fullShipmentQuery = `
        SELECT 
            s.*, 
            origin.branch_name as origin_branch_name,
            dest.branch_name as destination_branch_name
        FROM shipments s
        LEFT JOIN branches origin ON s.origin_branch_id = origin.id
        LEFT JOIN branches dest ON s.destination_branch_id = dest.id
        WHERE s.id = $1
    `;
    const fullShipmentResult = await db.query(fullShipmentQuery, [shipment_id]);
    const fullShipment = fullShipmentResult.rows[0];

    // 4. Fetch the complete, updated history
    const historyResult = await db.query('SELECT * FROM shipment_updates WHERE shipment_id = $1 ORDER BY "timestamp" DESC', [shipment_id]);

    // Commit the transaction
    await db.query('COMMIT');

    // 5. Emit a consistent real-time event with the full data structure
    if (req.io) {
      const fullUpdatePayload = {
          shipment: fullShipment,
          history: historyResult.rows
      };
      req.io.to(fullShipment.tracking_number).emit('shipmentUpdated', fullUpdatePayload);
    }

    res.status(201).json(newUpdate);

  } catch (err) {
    // Rollback in case of an error
    await db.query('ROLLBACK');
    console.error("Error adding shipment update:", err.message);
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
