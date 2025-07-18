import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bar, Pie, Line } from 'react-chartjs-2'; // Import Line chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement, // Register PointElement for Line chart
  LineElement, // Register LineElement for Line chart
} from 'chart.js';

// Register all the necessary components for our charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/reports/summary');
        setReportData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch report data. You may not have the required permissions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // Data for the daily shipments bar chart
  const dailyShipmentsChartData = {
    labels: reportData?.dailyShipments.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Shipments per Day',
      data: reportData?.dailyShipments.map(d => d.count) || [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  };

  // Data for the status breakdown pie chart
  const statusBreakdownChartData = {
    labels: reportData?.statusBreakdown.map(d => d.status) || [],
    datasets: [{
      label: 'Shipment Status Breakdown',
      data: reportData?.statusBreakdown.map(d => d.count) || [],
      backgroundColor: [
        'rgba(255, 206, 86, 0.6)', 'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
      borderWidth: 1,
    }],
  };

  // --- NEW CHART DATA ---
  // Data for the daily revenue line chart
  const dailyRevenueChartData = {
    labels: reportData?.dailyRevenue.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Revenue per Day ($)',
      data: reportData?.dailyRevenue.map(d => d.revenue) || [],
      fill: false,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      tension: 0.1,
    }],
  };

  if (loading) return <div className="text-center p-8">Loading reports...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- NEW CHART --- */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Last 7 Days Revenue</h2>
          <Line data={dailyRevenueChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Daily Revenue ($)' } } }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Last 7 Days Shipments</h2>
          <Bar data={dailyShipmentsChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Daily Shipment Volume' } } }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Shipment Status Breakdown</h2>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <Pie data={statusBreakdownChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'All-Time Status Breakdown' } } }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
