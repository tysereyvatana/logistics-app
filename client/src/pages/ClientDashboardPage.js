import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import PrintLabelModal from '../components/PrintLabelModal';
import { io } from 'socket.io-client';

// StatCard component (similar to the one in DashboardPage)
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

const ClientDashboardPage = () => {
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  // --- NEW: State for the search filter ---
  const [searchTerm, setSearchTerm] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const socketRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [shipmentsResponse, statsResponse] = await Promise.all([
        api.get('/api/shipments/my-shipments'),
        api.get('/api/shipments/my-stats')
      ]);
      setShipments(shipmentsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      setError('Could not fetch your dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();

      socketRef.current = io('http://localhost:5000');
      
      socketRef.current.emit('join_client_room', user.id);

      const handleUpdate = () => {
        console.log('Client data updated via WebSocket. Refetching...');
        fetchData();
      };

      socketRef.current.on('client_shipments_updated', handleUpdate);

      return () => {
        socketRef.current.off('client_shipments_updated', handleUpdate);
        socketRef.current.disconnect();
      };
    }
  }, [user, fetchData]);

  const openPrintModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsPrintModalOpen(true);
  };

  // --- NEW: Filter logic for the search bar ---
  const filteredShipments = shipments.filter(shipment => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const numericTerm = searchTerm.replace(/\D/g, '');

    if (!searchTerm) return true;

    if (shipment.tracking_number && String(shipment.tracking_number).toLowerCase().includes(lowercasedTerm)) return true;
    if (shipment.sender_name && String(shipment.sender_name).toLowerCase().includes(lowercasedTerm)) return true;
    if (shipment.receiver_name && String(shipment.receiver_name).toLowerCase().includes(lowercasedTerm)) return true;

    if (numericTerm) {
        if (shipment.sender_phone && String(shipment.sender_phone).replace(/\D/g, '').includes(numericTerm)) return true;
        if (shipment.receiver_phone && String(shipment.receiver_phone).replace(/\D/g, '').includes(numericTerm)) return true;
    }

    return false;
  });

  const icons = {
    total: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    inTransit: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m11-10h2m-2 2v10a1 1 0 01-1 1h-2m-6 0h7M4 16H2m15 0h-2" /></svg>,
    delivered: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      <PrintLabelModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shipment={selectedShipment}
      />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Shipments" value={stats?.total} icon={icons.total} loading={loading} />
            <StatCard title="Pending" value={stats?.pending} icon={icons.pending} loading={loading} />
            <StatCard title="In Transit" value={stats?.inTransit} icon={icons.inTransit} loading={loading} />
            <StatCard title="Delivered" value={stats?.delivered} icon={icons.delivered} loading={loading} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* --- UPDATED HEADER LAYOUT --- */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Shipment Details</h2>
            <div className="w-full md:w-1/2 lg:w-1/3">
                <input
                  type="text"
                  placeholder="Search by Tracking #, Name, or Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShipments.length > 0 ? (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          <Link to={`/track/${shipment.tracking_number}`} className="hover:underline">{shipment.tracking_number}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(shipment.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{shipment.sender_name}</div>
                        <div className="text-xs text-gray-500">{shipment.sender_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{shipment.receiver_name}</div>
                        <div className="text-xs text-gray-500">{shipment.receiver_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                          shipment.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">${parseFloat(shipment.price).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {shipment.is_cod ? (
                          <span className="font-bold text-green-600">Yes (${parseFloat(shipment.cod_amount).toFixed(2)})</span>
                        ) : (
                          <span>No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <span className="text-indigo-600 opacity-50 cursor-not-allowed">Edit</span>
                        <Link to={`/invoice/${shipment.id}`} className="text-green-600 hover:text-green-900">Invoice</Link>
                        <button onClick={() => openPrintModal(shipment)} className="text-gray-600 hover:text-gray-900">Print</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                      No shipments found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboardPage;
