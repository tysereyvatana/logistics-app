// server/routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get shipment summary for reports
// @route   GET /api/reports/summary
// @access  Private/Admin
router.get('/summary', protect, authorize('admin'), async (req, res) => {
    try {
        // Get start and end dates from query parameters
        const { startDate, endDate } = req.query;

        // --- Build WHERE clause for date filtering ---
        let dateFilter = `WHERE created_at >= NOW() - INTERVAL '7 days'`;
        const queryParams = [];

        // If both dates are provided, create a parameterized query
        if (startDate && endDate) {
            dateFilter = `WHERE created_at::date BETWEEN $1 AND $2`;
            queryParams.push(startDate, endDate);
        }

        // Query for daily shipments within the date range
        const dailyShipmentsQuery = `
            SELECT 
              DATE(created_at)::date AS date, 
              COUNT(*) AS count 
            FROM shipments 
            ${dateFilter}
            GROUP BY DATE(created_at) 
            ORDER BY date ASC;
        `;

        // Query for shipment status breakdown within the date range
        const statusBreakdownQuery = `
            SELECT 
              status, 
              COUNT(*) AS count 
            FROM shipments 
            ${dateFilter}
            GROUP BY status;
        `;

        // Query for daily revenue within the date range
        const dailyRevenueQuery = `
            SELECT
              DATE(created_at)::date AS date,
              SUM(price) AS revenue
            FROM shipments
            ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY date ASC;
        `;

        const [dailyShipments, statusBreakdown, dailyRevenue] = await Promise.all([
            db.query(dailyShipmentsQuery, queryParams),
            db.query(statusBreakdownQuery, queryParams),
            db.query(dailyRevenueQuery, queryParams),
        ]);

        res.json({
            dailyShipments: dailyShipments.rows,
            statusBreakdown: statusBreakdown.rows,
            dailyRevenue: dailyRevenue.rows,
        });
    } catch (err) {
        console.error("Error fetching report summary:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
