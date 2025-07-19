import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from './Modal';

const AddUpdateModal = ({ isOpen, onClose, shipmentId, onUpdateSuccess }) => {
  const [location, setLocation] = useState('');
  const [status_update, setStatusUpdate] = useState('');
  const [status, setStatus] = useState('in_transit'); // New state for status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status_update || !status) {
      setError('Status and update text are required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.post('/api/updates', {
        shipment_id: shipmentId,
        location,
        status_update,
        status, // Send the new status to the backend
      });
      onUpdateSuccess();
      onClose(); // Close the modal on success
    } catch (err) {
      setError('Failed to add update. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocation('');
      setStatusUpdate('');
      setStatus('in_transit');
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Shipment Update">
      <form onSubmit={handleSubmit}>
        {error && <p className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Message <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={status_update}
              onChange={(e) => setStatusUpdate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Arrived at sorting facility"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Phnom Penh Warehouse"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Adding...' : 'Add Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUpdateModal;
