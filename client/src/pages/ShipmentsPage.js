import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import CreateShipmentModal from '../components/CreateShipmentModal';
import EditShipmentModal from '../components/EditShipmentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PrintLabelModal from '../components/PrintLabelModal';
import { io } from 'socket.io-client';

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  
  const socketRef = useRef(null);

  const fetchShipments = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('/api/shipments');
      setShipments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch shipments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchShipments();

      socketRef.current = io('http://localhost:5000');
      socketRef.current.emit('join_shipments_room');
  
      const handleUpdate = () => {
        console.log('Shipments list updated via WebSocket. Refetching...');
        fetchShipments();
      };

      socketRef.current.on('shipments_updated', handleUpdate);
  
      return () => {
        socketRef.current.off('shipments_updated', handleUpdate);
        socketRef.current.disconnect();
      };
    }
  }, [user, fetchShipments]);

  const handleCreateShipment = async (newShipmentData) => {
    try {
      await api.post('/api/shipments', newShipmentData);
      setIsCreateModalOpen(false);
    } catch (err) {
      alert('Failed to create shipment.');
      console.error(err);
    }
  };

  const handleEditShipment = async (shipmentId, updateData) => {
    try {
      await api.put(`/api/shipments/${shipmentId}`, updateData);
      setIsEditModalOpen(false);
      setSelectedShipment(null);
    } catch (err) {
      alert('Failed to update shipment.');
      console.error(err);
    }
  };
  
  const handleDeleteShipment = async () => {
    if (!selectedShipment) return;
    try {
      await api.delete(`/api/shipments/${selectedShipment.id}`);
      setIsDeleteModalOpen(false);
      setSelectedShipment(null);
    } catch (err) {
      alert('Failed to delete shipment.');
      console.error(err);
    }
  };

  const openEditModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsEditModalOpen(true);
  };
  
  const openDeleteModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsDeleteModalOpen(true);
  };

  const openPrintModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsPrintModalOpen(true);
  };

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

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      <CreateShipmentModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onShipmentCreated={handleCreateShipment}
      />
      <EditShipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        shipment={selectedShipment}
        onShipmentUpdated={handleEditShipment}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteShipment}
        title="Delete Shipment"
        message={`Are you sure you want to permanently delete shipment #${selectedShipment?.tracking_number}?`}
      />
      <PrintLabelModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shipment={selectedShipment}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {/* --- UPDATED HEADER LAYOUT --- */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 self-start md:self-center">Manage Shipments</h1>
            <button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg">
              + Create Shipment
            </button>
          </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShipments.length > 0 ? (
                filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link to={`/track/${shipment.tracking_number}`} className="hover:underline">
                        {shipment.tracking_number}
                      </Link>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.origin_branch_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.destination_branch_name}</td>
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
                      <button onClick={() => openEditModal(shipment)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      <Link to={`/invoice/${shipment.id}`} className="text-green-600 hover:text-green-900">Invoice</Link>
                      <button onClick={() => openPrintModal(shipment)} className="text-gray-600 hover:text-gray-900">Print</button>
                      {user && user.role === 'admin' && (
                        <button onClick={() => openDeleteModal(shipment)} className="text-red-600 hover:text-red-900">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-gray-500">
                    No shipments found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ShipmentsPage;
