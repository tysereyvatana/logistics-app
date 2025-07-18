import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const UpdateShipmentModal = ({ isOpen, onClose, shipment, onShipmentUpdated }) => {
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [error, setError] = useState('');

  // When the modal opens, pre-fill the form with the current shipment's status
  useEffect(() => {
    if (shipment) {
      setStatus(shipment.status);
      setLocation('');
      setUpdateMessage('');
      setError('');
    }
  }, [shipment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!status || !location || !updateMessage) {
      setError('All fields are required.');
      return;
    }
    setError('');
    
    const updateData = {
      status: status,
      location: location,
      status_update_message: updateMessage,
    };

    onShipmentUpdated(shipment.id, updateData);
  };
  
  if (!shipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update #${shipment.tracking_number}`}>
      <form onSubmit={handleSubmit}>
        {error && <p className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</p>}
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                    Shipment Status
                </label>
                <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="delayed">Delayed</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
                    Current Location
                </label>
                <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g., Phnom Penh Sorting Facility"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="updateMessage">
                    Update Message
                </label>
                <input
                    id="updateMessage"
                    type="text"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g., Departed from facility"
                    required
                />
            </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Update Status
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateShipmentModal;
