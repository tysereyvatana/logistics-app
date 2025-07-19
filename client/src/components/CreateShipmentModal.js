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
    service_type: '',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    is_cod: false,
    cod_amount: ''
  });

  // State for the raw data lists
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rates, setRates] = useState([]);
  const [error, setError] = useState('');

  // State for the searchable input fields
  const [clientSearch, setClientSearch] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');

  // State to control visibility of the suggestion dropdowns
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsResponse, branchesResponse, ratesResponse] = await Promise.all([
            api.get('/api/users/clients'),
            api.get('/api/branches'),
            api.get('/api/rates')
          ]);
          setClients(clientsResponse.data);
          setBranches(branchesResponse.data);
          setRates(ratesResponse.data);

          if (ratesResponse.data.length > 0) {
            setFormData(prev => ({ ...prev, service_type: ratesResponse.data[0].service_name }));
          }
        } catch (err) {
          console.error("Failed to fetch data", err);
          setError("Could not load required data.");
        }
      };
      fetchData();
      // Reset form on open
      setFormData({
        clientId: '', origin_branch_id: '', destination_branch_id: '',
        estimated_delivery: '', weight_kg: '', service_type: '',
        sender_name: '', sender_phone: '', receiver_name: '', receiver_phone: '',
        is_cod: false, cod_amount: ''
      });
      setClientSearch('');
      setOriginSearch('');
      setDestinationSearch('');
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  // Filter functions for the searchable inputs
  const filteredClients = clientSearch
    ? clients.filter(c => c.full_name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  const filteredBranches = (searchInput) => searchInput
    ? branches.filter(b => b.branch_name.toLowerCase().includes(searchInput.toLowerCase()))
    : branches;

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
                {/* Searchable Client Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Client</label>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setShowClientSuggestions(true); }}
                    onFocus={() => setShowClientSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                    placeholder="Search for a client..."
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  />
                  {showClientSuggestions && (
                    <ul className="absolute z-20 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                      {filteredClients.map(client => (
                        <li key={client.id} onMouseDown={() => {
                          setClientSearch(client.full_name);
                          setFormData(prev => ({ ...prev, clientId: client.id, sender_name: client.full_name }));
                          setShowClientSuggestions(false);
                        }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          {client.full_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Searchable Origin Branch Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin Branch</label>
                  <input
                    type="text"
                    value={originSearch}
                    onChange={(e) => { setOriginSearch(e.target.value); setShowOriginSuggestions(true); }}
                    onFocus={() => setShowOriginSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)}
                    placeholder="Search for an origin branch..."
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
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
                {/* Searchable Destination Branch Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Branch</label>
                  <input
                    type="text"
                    value={destinationSearch}
                    onChange={(e) => { setDestinationSearch(e.target.value); setShowDestinationSuggestions(true); }}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 150)}
                    placeholder="Search for a destination branch..."
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
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
                    {rates.map(rate => (
                      <option key={rate.id} value={rate.service_name}>
                        {rate.service_name.charAt(0).toUpperCase() + rate.service_name.slice(1)}
                      </option>
                    ))}
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
