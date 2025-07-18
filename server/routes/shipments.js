// -------------------------------------------------------------------
// FILE: routes/shipments.js
// DESCRIPTION: Fixed the public tracking route to include branch names.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Pricing Logic Helper Function ---
const calculatePrice = async (weight_kg, service_type) => {
    const weight = parseFloat(weight_kg) || 0;
    const ratePerKg = 1.5;
    const rateResult = await pool.query('SELECT base_rate FROM service_rates WHERE service_name = $1', [service_type]);
    const baseRate = rateResult.rows.length > 0 ? parseFloat(rateResult.rows[0].base_rate) : 5.00;
    const finalPrice = baseRate + (weight * ratePerKg);
    return finalPrice.toFixed(2);
};

// --- Specific GET routes must come BEFORE general GET routes like /:id ---

router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const query = `
            SELECT 
                s.*, 
                origin.branch_name as origin_branch_name,
                dest.branch_name as destination_branch_name
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

router.get('/stats', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const statsQuery = `
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'in_transit') AS "inTransit",
                COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
                COUNT(*) FILTER (WHERE status = 'delayed') AS delayed
            FROM shipments;
        `;
        const result = await pool.query(statsQuery);
        const stats = {
            total: parseInt(result.rows[0].total, 10),
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

router.get('/my-shipments', protect, async (req, res) => {
    try {
        const clientId = req.user.id;
        const query = `
            SELECT 
                s.*, 
                origin.branch_name as origin_branch_name,
                dest.branch_name as destination_branch_name
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

// --- UPDATED /track/:trackingNumber ROUTE ---
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
        res.status(201).json(shipment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    const {
        origin_branch_id, destination_branch_id, estimated_delivery,
        weight_kg, service_type, status,
        sender_name, sender_phone, receiver_name, receiver_phone,
        is_cod, cod_amount,
        location, status_update_message
    } = req.body;

    try {
        const currentShipmentResult = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
        if (currentShipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        const currentShipment = currentShipmentResult.rows[0];

        const queryParams = [
            origin_branch_id || currentShipment.origin_branch_id,
            destination_branch_id || currentShipment.destination_branch_id,
            estimated_delivery || currentShipment.estimated_delivery,
            weight_kg || currentShipment.weight_kg,
            service_type || currentShipment.service_type,
            status || currentShipment.status,
            await calculatePrice(weight_kg || currentShipment.weight_kg, service_type || currentShipment.service_type),
            sender_name || currentShipment.sender_name,
            sender_phone || currentShipment.sender_phone,
            receiver_name || currentShipment.receiver_name,
            receiver_phone || currentShipment.receiver_phone,
            (is_cod === true || is_cod === false) ? is_cod : currentShipment.is_cod,
            cod_amount || currentShipment.cod_amount,
            id
        ];

        const updatedShipmentResult = await pool.query(
            `UPDATE shipments SET 
                origin_branch_id = $1, destination_branch_id = $2, estimated_delivery = $3, 
                weight_kg = $4, service_type = $5, status = $6, price = $7,
                sender_name = $8, sender_phone = $9, receiver_name = $10, receiver_phone = $11,
                is_cod = $12, cod_amount = $13
            WHERE id = $14 RETURNING *`,
            queryParams
        );
        const updatedShipment = updatedShipmentResult.rows[0];

        if (status_update_message && location) {
            await pool.query(
                'INSERT INTO shipment_updates (shipment_id, location, status_update) VALUES ($1, $2, $3)',
                [id, location, status_update_message]
            );
            const historyResult = await pool.query('SELECT * FROM shipment_updates WHERE shipment_id = $1 ORDER BY "timestamp" DESC', [id]);
            const fullUpdate = { shipment: updatedShipment, history: historyResult.rows };
            req.io.to(updatedShipment.tracking_number).emit('shipmentUpdated', fullUpdate);
        }

        res.json(updatedShipment);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM shipments WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        res.json({ msg: 'Shipment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper function
const generateTrackingNumber = () => {
    const prefix = 'LS';
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    return `${prefix}${randomNumber}`;
};

module.exports = router;
