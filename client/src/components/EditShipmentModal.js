import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

const EditShipmentModal = ({ isOpen, onClose, shipment, onShipmentUpdated }) => {
  const [formData, setFormData] = useState({});
  const [branches, setBranches] = useState([]);
  const [rates, setRates] = useState([]);
  
  // State for the text inputs
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // State for the optional status update
  const [location, setLocation] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
        const fetchData = async () => {
            try {
                const [branchesResponse, ratesResponse] = await Promise.all([
                    api.get('/api/branches'),
                    api.get('/api/rates')
                ]);
                setBranches(branchesResponse.data);
                setRates(ratesResponse.data);

                if (shipment) {
                    const origin = branchesResponse.data.find(b => b.id === shipment.origin_branch_id);
                    const destination = branchesResponse.data.find(b => b.id === shipment.destination_branch_id);
                    setOriginSearch(origin ? origin.branch_name : '');
                    setDestinationSearch(destination ? destination.branch_name : '');
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }
    if (shipment) {
      const estDeliveryDate = shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toISOString().split('T')[0] : '';
      setFormData({
        ...shipment,
        estimated_delivery: estDeliveryDate,
      });
      setLocation('');
      setStatusUpdateMessage('');
    }
  }, [shipment, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  const filteredBranches = (searchInput) => searchInput
    ? branches.filter(b => b.branch_name.toLowerCase().includes(searchInput.toLowerCase()))
    : branches;

  if (!shipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Shipment #${shipment.tracking_number}`}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Route</legend>
              <div className="space-y-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin Branch</label>
                    <input
                      type="text"
                      value={originSearch}
                      onChange={(e) => { setOriginSearch(e.target.value); setShowOriginSuggestions(true); }}
                      onFocus={() => setShowOriginSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)}
                      placeholder="Search for origin..."
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                    {showOriginSuggestions && (
                      <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {filteredBranches(originSearch).map(branch => (
                          <li key={branch.id} onMouseDown={() => {
                            setOriginSearch(branch.branch_name);
                            setFormData(prev => ({ ...prev, origin_branch_id: branch.id }));
                            setShowOriginSuggestions(false);
                          }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            {branch.branch_name}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Branch</label>
                    <input
                      type="text"
                      value={destinationSearch}
                      onChange={(e) => { setDestinationSearch(e.target.value); setShowDestinationSuggestions(true); }}
                      onFocus={() => setShowDestinationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 150)}
                      placeholder="Search for destination..."
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                    {showDestinationSuggestions && (
                      <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {filteredBranches(destinationSearch).map(branch => (
                          <li key={branch.id} onMouseDown={() => {
                            setDestinationSearch(branch.branch_name);
                            setFormData(prev => ({ ...prev, destination_branch_id: branch.id }));
                            setShowDestinationSuggestions(false);
                          }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            {branch.branch_name}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Sender Information</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input name="sender_name" value={formData.sender_name || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Phone</label>
                  <input name="sender_phone" value={formData.sender_phone || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
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
                  <input name="weight_kg" type="number" value={formData.weight_kg || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select name="service_type" value={formData.service_type || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                    {rates.map(rate => (
                      <option key={rate.id} value={rate.service_name}>
                        {rate.service_name.charAt(0).toUpperCase() + rate.service_name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                  <input name="estimated_delivery" type="date" value={formData.estimated_delivery || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-2">Payment</legend>
                <div className="flex items-center">
                    <input id="edit_is_cod" name="is_cod" type="checkbox" checked={formData.is_cod || false} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                    <label htmlFor="edit_is_cod" className="ml-2 block text-sm font-medium">Cash on Delivery (COD)</label>
                </div>
                {formData.is_cod && (
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">COD Amount ($)</label>
                        <input name="cod_amount" type="number" step="0.01" value={formData.cod_amount || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
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
                      <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
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
