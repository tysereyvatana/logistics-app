import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

const CreateShipmentModal = ({ isOpen, onClose, onShipmentCreated }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    origin_branch_id: '',
    destination_branch_id: '',
    estimated_delivery: '',
    weight_kg: '',
    service_type: 'standard',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    is_cod: false,
    cod_amount: ''
  });
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsResponse, branchesResponse] = await Promise.all([
            api.get('/api/users/clients'),
            api.get('/api/branches')
          ]);
          setClients(clientsResponse.data);
          setBranches(branchesResponse.data);
        } catch (err) {
          console.error("Failed to fetch data", err);
          setError("Could not load required data.");
        }
      };
      fetchData();
      // Reset form on open
      setFormData({
        clientId: '',
        origin_branch_id: '',
        destination_branch_id: '',
        estimated_delivery: '',
        weight_kg: '',
        service_type: 'standard',
        sender_name: '',
        sender_phone: '',
        receiver_name: '',
        receiver_phone: '',
        is_cod: false,
        cod_amount: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (name === 'clientId') {
        const selectedClient = clients.find(client => client.id === value);
        if (selectedClient) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                sender_name: selectedClient.full_name
            }));
            return;
        }
    }

    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { clientId, ...rest } = formData;
    const newShipmentData = {
      ...rest,
      client_id: clientId,
      cod_amount: rest.is_cod ? rest.cod_amount : 0,
    };
    onShipmentCreated(newShipmentData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
      <form onSubmit={handleSubmit}>
        {error && <p className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Client & Route</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Client</label>
                  <select name="clientId" value={formData.clientId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white" required>
                    <option value="" disabled>-- Select a Client --</option>
                    {clients.map(client => (<option key={client.id} value={client.id}>{client.full_name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin Branch</label>
                  <select name="origin_branch_id" value={formData.origin_branch_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white" required>
                    <option value="" disabled>-- Select Origin --</option>
                    {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.branch_name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Branch</label>
                  <select name="destination_branch_id" value={formData.destination_branch_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white" required>
                    <option value="" disabled>-- Select Destination --</option>
                    {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.branch_name}</option>))}
                  </select>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Center Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Contact Information</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input name="sender_name" value={formData.sender_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Phone</label>
                  <input name="sender_phone" value={formData.sender_phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                  <input name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Phone</label>
                  <input name="receiver_phone" value={formData.receiver_phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required/>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Shipment Details</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input name="weight_kg" type="number" step="0.01" value={formData.weight_kg} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required/>
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
                  <input name="estimated_delivery" type="date" value={formData.estimated_delivery} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required/>
                </div>
              </div>
            </fieldset>
            
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Payment</legend>
              <div className="flex items-center">
                  <input id="is_cod" name="is_cod" type="checkbox" checked={formData.is_cod} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                  <label htmlFor="is_cod" className="ml-2 block text-sm font-medium">Cash on Delivery (COD)</label>
              </div>
              {formData.is_cod && (
                  <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">COD Amount ($)</label>
                      <input name="cod_amount" type="number" step="0.01" value={formData.cod_amount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required={formData.is_cod} />
                  </div>
              )}
            </fieldset>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end mt-8 border-t pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-6 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Create Shipment</button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateShipmentModal;
