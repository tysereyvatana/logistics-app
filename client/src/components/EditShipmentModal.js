import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

const initialFormState = {
    origin_branch_id: '',
    destination_branch_id: '',
    estimated_delivery: '',
    weight_kg: '',
    service_type: 'standard',
    status: 'pending',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    is_cod: false,
    cod_amount: ''
};

const EditShipmentModal = ({ isOpen, onClose, shipment, onShipmentUpdated }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [branches, setBranches] = useState([]);
  const [location, setLocation] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
        const fetchBranches = async () => {
            try {
                const response = await api.get('/api/branches');
                setBranches(response.data);
            } catch (err) {
                console.error("Failed to fetch branches", err);
            }
        };
        fetchBranches();
    }
    if (shipment) {
      const estDeliveryDate = shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toISOString().split('T')[0] : '';
      setFormData({
        origin_branch_id: shipment.origin_branch_id || '',
        destination_branch_id: shipment.destination_branch_id || '',
        estimated_delivery: estDeliveryDate,
        weight_kg: shipment.weight_kg || '',
        service_type: shipment.service_type || 'standard',
        status: shipment.status || 'pending',
        sender_name: shipment.sender_name || '',
        sender_phone: shipment.sender_phone || '',
        receiver_name: shipment.receiver_name || '',
        receiver_phone: shipment.receiver_phone || '',
        is_cod: shipment.is_cod || false,
        cod_amount: shipment.cod_amount || ''
      });
      setLocation('');
      setStatusUpdateMessage('');
    }
  }, [shipment, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (location && statusUpdateMessage) {
      finalData.location = location;
      finalData.status_update_message = statusUpdateMessage;
    }
    finalData.cod_amount = finalData.is_cod ? finalData.cod_amount : 0;
    onShipmentUpdated(shipment.id, finalData);
  };

  if (!shipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Shipment #${shipment.tracking_number}`}>
      <form onSubmit={handleSubmit}>
        {/* Main 3-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Route</legend>
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin Branch</label>
                    <select name="origin_branch_id" value={formData.origin_branch_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                        {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.branch_name}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Branch</label>
                    <select name="destination_branch_id" value={formData.destination_branch_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                        {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.branch_name}</option>))}
                    </select>
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Sender Information</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input name="sender_name" value={formData.sender_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Phone</label>
                  <input name="sender_phone" value={formData.sender_phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </fieldset>
          </div>

          {/* Center Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Shipment Details</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input name="weight_kg" type="number" value={formData.weight_kg} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select name="service_type" value={formData.service_type} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="overnight">Overnight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                  <input name="estimated_delivery" type="date" value={formData.estimated_delivery} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Payment</legend>
                <div className="flex items-center">
                    <input id="edit_is_cod" name="is_cod" type="checkbox" checked={formData.is_cod} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                    <label htmlFor="edit_is_cod" className="ml-2 block text-sm font-medium">Cash on Delivery (COD)</label>
                </div>
                {formData.is_cod && (
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">COD Amount ($)</label>
                        <input name="cod_amount" type="number" step="0.01" value={formData.cod_amount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                )}
            </fieldset>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Add New Status Update <span className="text-sm font-normal text-gray-500">(Optional)</span></legend>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                          <option value="pending">Pending</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="delayed">Delayed</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Phnom Penh Facility" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Update Message</label>
                      <input value={statusUpdateMessage} onChange={(e) => setStatusUpdateMessage(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Arrived at sorting center" />
                  </div>
              </div>
            </fieldset>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end mt-8 border-t pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-6 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditShipmentModal;
