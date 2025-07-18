// server/routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get shipment summary for reports
// @route   GET /api/reports/summary
// @access  Private/Admin
router.get(
  '/summary',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      // Query for daily shipments for the last 7 days
      const dailyShipmentsQuery = `
        SELECT 
          DATE(created_at)::date AS date, 
          COUNT(*) AS count 
        FROM shipments 
        WHERE created_at >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(created_at) 
        ORDER BY date ASC;
      `;

      // Query for shipment status breakdown
      const statusBreakdownQuery = `
        SELECT 
          status, 
          COUNT(*) AS count 
        FROM shipments 
        GROUP BY status;
      `;

      // --- CORRECTED QUERY ---
      // Query for daily revenue for the last 7 days using the 'price' column.
      const dailyRevenueQuery = `
        SELECT
          DATE(created_at)::date AS date,
          SUM(price) AS revenue
        FROM shipments
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC;
      `;

      const [dailyShipments, statusBreakdown, dailyRevenue] = await Promise.all([
        db.query(dailyShipmentsQuery),
        db.query(statusBreakdownQuery),
        db.query(dailyRevenueQuery),
      ]);

      res.json({
        dailyShipments: dailyShipments.rows,
        statusBreakdown: statusBreakdown.rows,
        dailyRevenue: dailyRevenue.rows,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
