// -------------------------------------------------------------------
// FILE: routes/shipments.js
// DESCRIPTION: Updated GET routes to include full branch addresses.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Helper Functions ---
const calculatePrice = async (weight_kg, service_type) => {
    const weight = parseFloat(weight_kg) || 0;
    const ratePerKg = 1.5;
    const rateResult = await pool.query('SELECT base_rate FROM service_rates WHERE service_name = $1', [service_type]);
    const baseRate = rateResult.rows.length > 0 ? parseFloat(rateResult.rows[0].base_rate) : 5.00;
    return (baseRate + (weight * ratePerKg)).toFixed(2);
};

const generateTrackingNumber = () => `TK${Math.floor(1000000000 + Math.random() * 9000000000)}`;

// --- GET Routes ---

// GET all shipments (for admin/staff)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const query = `
            SELECT 
                s.*, 
                origin.branch_name as origin_branch_name,
                origin.branch_address as origin_branch_address,
                dest.branch_name as destination_branch_name,
                dest.branch_address as destination_branch_address
            FROM shipments s
            LEFT JOIN branches origin ON s.origin_branch_id = origin.id
            LEFT JOIN branches dest ON s.destination_branch_id = dest.id
            ORDER BY s.created_at DESC
        `;
        const shipments = await pool.query(query);
        res.json(shipments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET dashboard stats
router.get('/stats', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const statsQuery = `
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'in_transit') AS "inTransit",
                COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
                COUNT(*) FILTER (WHERE status = 'delayed') AS delayed
            FROM shipments;
        `;
        const result = await pool.query(statsQuery);
        const stats = {
            total: parseInt(result.rows[0].total, 10),
            pending: parseInt(result.rows[0].pending, 10),
            inTransit: parseInt(result.rows[0].inTransit, 10),
            delivered: parseInt(result.rows[0].delivered, 10),
            delayed: parseInt(result.rows[0].delayed, 10),
        };
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET dashboard stats for the logged-in client
router.get('/my-stats', protect, async (req, res) => {
    try {
        const clientId = req.user.id;
        const statsQuery = `
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'in_transit') AS "inTransit",
                COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
                COUNT(*) FILTER (WHERE status = 'delayed') AS delayed
            FROM shipments
            WHERE client_id = $1;
        `;
        const result = await pool.query(statsQuery, [clientId]);
        const stats = {
            total: parseInt(result.rows[0].total, 10),
            pending: parseInt(result.rows[0].pending, 10),
            inTransit: parseInt(result.rows[0].inTransit, 10),
            delivered: parseInt(result.rows[0].delivered, 10),
            delayed: parseInt(result.rows[0].delayed, 10),
        };
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// GET recent activity
router.get('/recent-activity', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const activityQuery = `
            SELECT su.id, su.status_update, su.location, su.timestamp, s.tracking_number
            FROM shipment_updates su JOIN shipments s ON su.shipment_id = s.id
            ORDER BY su.timestamp DESC LIMIT 5;
        `;
        const result = await pool.query(activityQuery);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET shipments for the logged-in client
router.get('/my-shipments', protect, async (req, res) => {
    try {
        const clientId = req.user.id;
        const query = `
            SELECT 
                s.*, 
                origin.branch_name as origin_branch_name,
                origin.branch_address as origin_branch_address,
                dest.branch_name as destination_branch_name,
                dest.branch_address as destination_branch_address
            FROM shipments s
            LEFT JOIN branches origin ON s.origin_branch_id = origin.id
            LEFT JOIN branches dest ON s.destination_branch_id = dest.id
            WHERE s.client_id = $1 
            ORDER BY s.created_at DESC
        `;
        const shipments = await pool.query(query, [clientId]);
        res.json(shipments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET public tracking info
router.get('/track/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const query = `
            SELECT 
                s.*, 
                origin.branch_name as origin_branch_name,
                dest.branch_name as destination_branch_name
            FROM shipments s
            LEFT JOIN branches origin ON s.origin_branch_id = origin.id
            LEFT JOIN branches dest ON s.destination_branch_id = dest.id
            WHERE s.tracking_number = $1
        `;
        const shipmentResult = await pool.query(query, [trackingNumber]);

        if (shipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        const shipment = shipmentResult.rows[0];
        const updatesResult = await pool.query(
            'SELECT * FROM shipment_updates WHERE shipment_id = $1 ORDER BY "timestamp" DESC', 
            [shipment.id]
        );
        res.json({ shipment, history: updatesResult.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET a single shipment by ID (for invoices, etc.)
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                s.*, 
                origin.branch_name as origin_branch_name,
                origin.branch_address as origin_branch_address,
                dest.branch_name as destination_branch_name,
                dest.branch_address as destination_branch_address
            FROM shipments s
            LEFT JOIN branches origin ON s.origin_branch_id = origin.id
            LEFT JOIN branches dest ON s.destination_branch_id = dest.id
            WHERE s.id = $1
        `;
        const shipmentResult = await pool.query(query, [id]);

        if (shipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        
        const shipment = shipmentResult.rows[0];
        const user = req.user;

        if (user.role === 'admin' || user.role === 'staff' || user.id === shipment.client_id) {
            res.json(shipment);
        } else {
            return res.status(403).json({ msg: 'User not authorized to view this shipment' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- POST Route ---
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
    const { 
        client_id, origin_branch_id, destination_branch_id, estimated_delivery, 
        weight_kg, service_type,
        sender_name, sender_phone, receiver_name, receiver_phone,
        is_cod, cod_amount
    } = req.body;
    
    if (!origin_branch_id || !destination_branch_id) { return res.status(400).json({ msg: 'Origin and destination branches are required.' }); }
    if (!client_id || !weight_kg || !service_type || !sender_name || !receiver_name) { return res.status(400).json({ msg: 'Please fill out all required fields.' }); }

    const price = await calculatePrice(weight_kg, service_type);
    const tracking_number = generateTrackingNumber();
    const status = 'pending';
    try {
        const newShipment = await pool.query(
            `INSERT INTO shipments (
                tracking_number, client_id, estimated_delivery, weight_kg, service_type, price,
                sender_name, sender_phone, receiver_name, receiver_phone,
                is_cod, cod_amount, origin_branch_id, destination_branch_id, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [
                tracking_number, client_id, estimated_delivery, weight_kg, service_type, price,
                sender_name, sender_phone, receiver_name, receiver_phone,
                is_cod || false, cod_amount || 0, origin_branch_id, destination_branch_id, status
            ]
        );
        const shipment = newShipment.rows[0];
        
        const originBranch = await pool.query('SELECT branch_address FROM branches WHERE id = $1', [origin_branch_id]);
        const initialLocation = originBranch.rows.length > 0 ? originBranch.rows[0].branch_address : 'Origin Facility';

        await pool.query(
            'INSERT INTO shipment_updates (shipment_id, location, status_update) VALUES ($1, $2, $3)',
            [shipment.id, initialLocation, 'Shipment created and pending pickup.']
        );

        // --- REAL-TIME UPDATES ---
        req.io.to('shipments_room').emit('shipments_updated');
        req.io.to(`client_${client_id}`).emit('client_shipments_updated');
        
        res.status(201).json(shipment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- PUT Route ---
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    const {
        location, status_update_message, ...shipmentData
    } = req.body;

    try {
        const currentShipmentResult = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
        if (currentShipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        const currentShipment = currentShipmentResult.rows[0];

        if (shipmentData.weight_kg !== undefined || shipmentData.service_type !== undefined) {
            const newWeight = shipmentData.weight_kg !== undefined ? shipmentData.weight_kg : currentShipment.weight_kg;
            const newService = shipmentData.service_type !== undefined ? shipmentData.service_type : currentShipment.service_type;
            shipmentData.price = await calculatePrice(newWeight, newService);
        }

        const updateFields = Object.keys(shipmentData);
        let updatedShipment = currentShipment;

        if (updateFields.length > 0) {
            const setClause = updateFields
                .map((key, index) => `"${key}" = $${index + 1}`)
                .join(', ');
            const queryParams = [...Object.values(shipmentData), id];
            
            const queryText = `UPDATE shipments SET ${setClause} WHERE id = $${queryParams.length} RETURNING *`;
            
            const updatedShipmentResult = await pool.query(queryText, queryParams);
            updatedShipment = updatedShipmentResult.rows[0];
        }

        if (status_update_message && location) {
            await pool.query(
                'INSERT INTO shipment_updates (shipment_id, location, status_update) VALUES ($1, $2, $3)',
                [id, location, status_update_message]
            );
        }
        
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
        const fullShipmentResult = await pool.query(fullShipmentQuery, [id]);
        const fullShipment = fullShipmentResult.rows[0];
        const historyResult = await pool.query('SELECT * FROM shipment_updates WHERE shipment_id = $1 ORDER BY "timestamp" DESC', [id]);
        
        const fullUpdatePayload = {
            shipment: fullShipment,
            history: historyResult.rows
        };
        
        // --- REAL-TIME UPDATES ---
        req.io.to(fullShipment.tracking_number).emit('shipmentUpdated', fullUpdatePayload);
        req.io.to('shipments_room').emit('shipments_updated');
        req.io.to(`client_${fullShipment.client_id}`).emit('client_shipments_updated');

        res.json(updatedShipment);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- DELETE Route ---
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const shipmentResult = await pool.query('SELECT client_id FROM shipments WHERE id = $1', [id]);
        if (shipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        const clientId = shipmentResult.rows[0].client_id;

        const deleteOp = await pool.query('DELETE FROM shipments WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Shipment not found during delete operation' });
        }
        
        // --- REAL-TIME UPDATES ---
        req.io.to('shipments_room').emit('shipments_updated');
        if (clientId) {
            req.io.to(`client_${clientId}`).emit('client_shipments_updated');
        }

        res.json({ msg: 'Shipment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
