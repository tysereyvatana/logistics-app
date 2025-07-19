import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client'; // 1. Import socket.io-client

const StatCard = ({ title, value, icon, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
    <div className="bg-blue-100 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      {loading ? (
        <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      )}
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  // 2. Wrap the data fetching logic in useCallback for stability
  const fetchData = useCallback(async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/api/shipments/stats'),
        api.get('/api/shipments/recent-activity')
      ]);
      setStats(statsResponse.data);
      setActivity(activityResponse.data);
    } catch (err) {
      setError('Could not load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Set up the WebSocket connection and listener in useEffect
  useEffect(() => {
    fetchData(); // Fetch initial data

    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[DashboardPage] Socket connected, joining shipments_room...');
      socket.emit('join_shipments_room');
    });

    const handleUpdate = () => {
      console.log('[DashboardPage] Received shipments_updated event. Refetching data...');
      fetchData();
    };

    socket.on('shipments_updated', handleUpdate);

    // Cleanup on component unmount
    return () => {
      console.log('[DashboardPage] Disconnecting socket.');
      socket.off('shipments_updated', handleUpdate);
      socket.disconnect();
    };
  }, [fetchData]);

  const icons = {
    total: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    inTransit: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m11-10h2m-2 2v10a1 1 0 01-1 1h-2m-6 0h7M4 16H2m15 0h-2" /></svg>,
    delivered: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    delayed: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  };

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard title="Total Shipments" value={stats?.total} icon={icons.total} loading={loading} />
            <StatCard title="Pending" value={stats?.pending} icon={icons.pending} loading={loading} />
            <StatCard title="In Transit" value={stats?.inTransit} icon={icons.inTransit} loading={loading} />
            <StatCard title="Delivered" value={stats?.delivered} icon={icons.delivered} loading={loading} />
            <StatCard title="Delayed" value={stats?.delayed} icon={icons.delayed} loading={loading} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            {loading ? (
                <p className="text-gray-500">Loading activity...</p>
            ) : activity.length > 0 ? (
                <ul className="space-y-4">
                    {activity.map(item => (
                        <li key={item.id} className="flex items-start space-x-3">
                            <div className="bg-gray-100 p-2 rounded-full mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12A8 8 0 1013.2 5.2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {item.status_update} - <span className="font-normal text-gray-600">{item.location}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Shipment #{item.tracking_number}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No recent activity found.</p>
            )}
        </div>
    </div>
  );
};

export default DashboardPage;
