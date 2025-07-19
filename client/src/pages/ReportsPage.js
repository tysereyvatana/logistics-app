import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
);

// Helper to format date to YYYY-MM-DD for input fields
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for date range, defaults to the last 7 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return formatDate(date);
  });
  const [endDate, setEndDate] = useState(formatDate(new Date()));

  const fetchReportData = useCallback(async (start, end) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/reports/summary?startDate=${start}&endDate=${end}`);
      setReportData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch report data. You may not have the required permissions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on initial component load
  useEffect(() => {
    fetchReportData(startDate, endDate);
  }, [fetchReportData]);

  const handleGenerateReport = () => {
    fetchReportData(startDate, endDate);
  };

  // Chart data configurations
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

  const statusBreakdownChartData = {
    labels: reportData?.statusBreakdown.map(d => d.status.replace('_', ' ').toUpperCase()) || [],
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

  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Reports Dashboard</h1>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="self-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Revenue</h2>
            <Line data={dailyRevenueChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Daily Revenue ($)' } } }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Shipment Volume</h2>
            <Bar data={dailyShipmentsChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Daily Shipment Volume' } } }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <Pie data={statusBreakdownChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Shipment Status Breakdown' } } }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
