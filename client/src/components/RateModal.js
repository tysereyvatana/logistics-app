import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const RateModal = ({ isOpen, onClose, onSave, existingRate }) => {
  const [serviceName, setServiceName] = useState('');
  const [baseRate, setBaseRate] = useState('');

  useEffect(() => {
    if (existingRate) {
      setServiceName(existingRate.service_name);
      setBaseRate(existingRate.base_rate);
    } else {
      // Reset form for "Add New"
      setServiceName('');
      setBaseRate('');
    }
  }, [existingRate, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ service_name: serviceName, base_rate: baseRate });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingRate ? 'Edit Service Rate' : 'Add New Service Rate'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="serviceName">Service Name</label>
          <input
            id="serviceName"
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg"
            placeholder="e.g., same-day"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="baseRate">Base Rate ($)</label>
          <input
            id="baseRate"
            type="number"
            step="0.01"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg"
            placeholder="e.g., 50.00"
            required
          />
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-5 py-2.5 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default RateModal;
