import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import CreateShipmentModal from '../components/CreateShipmentModal';
import EditShipmentModal from '../components/EditShipmentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PrintLabelModal from '../components/PrintLabelModal';
// --- 1. IMPORT THE NEW MODAL ---
import AddUpdateModal from '../components/AddUpdateModal';

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  // Your existing modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // --- 2. ADD STATE FOR THE NEW MODAL ---
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  
  const fetchShipments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get('/api/shipments');
      setShipments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch shipments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [user]);

  // Your existing handler functions
  const handleCreateShipment = async (newShipmentData) => {
    try {
      await api.post('/api/shipments', newShipmentData);
      fetchShipments();
      setIsCreateModalOpen(false);
    } catch (err) {
      alert('Failed to create shipment.');
      console.error(err);
    }
  };

  const handleEditShipment = async (shipmentId, updateData) => {
    try {
      await api.put(`/api/shipments/${shipmentId}`, updateData);
      fetchShipments();
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
      setShipments(shipments.filter(s => s.id !== selectedShipment.id));
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

  // --- 3. ADD HANDLERS FOR THE NEW MODAL ---
  const openUpdateModal = (shipment) => {
    setSelectedShipment(shipment);
    setUpdateModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    alert('Shipment update added successfully!');
    // The real-time update will appear on the TrackingPage automatically.
    // We also re-fetch shipments to update the status in the table.
    fetchShipments();
  };


  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      {/* Your existing modals */}
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
      {/* --- 4. RENDER THE NEW MODAL --- */}
      <AddUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        shipmentId={selectedShipment?.id}
        onUpdateSuccess={handleUpdateSuccess}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Shipments</h1>
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg">
            + Create Shipment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{shipment.tracking_number}</td>
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
                      {/* --- 5. ADD THE NEW BUTTON TO YOUR ACTIONS --- */}
                      <button onClick={() => openUpdateModal(shipment)} className="text-purple-600 hover:text-purple-900">Update</button>
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
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    No shipments found.
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
