import React, { useState } from 'react';
import api from '../services/api';
import Modal from './Modal'; // Assuming you have a generic Modal component

const AddUpdateModal = ({ isOpen, onClose, shipmentId, onUpdateSuccess }) => {
  const [location, setLocation] = useState('');
  const [status_update, setStatusUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status_update) {
      setError('Status update text is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.post('/api/updates', {
        shipment_id: shipmentId,
        location,
        status_update,
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
  React.useEffect(() => {
    if (isOpen) {
      setLocation('');
      setStatusUpdate('');
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Add Shipment Update</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="status_update" className="block text-sm font-medium text-gray-700">
              Status Update <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="status_update"
              value={status_update}
              onChange={(e) => setStatusUpdate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location (e.g., "Phnom Penh Warehouse")
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-4">
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
      </div>
    </Modal>
  );
};

export default AddUpdateModal;
