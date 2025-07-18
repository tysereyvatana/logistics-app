import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const BranchModal = ({ isOpen, onClose, onSave, existingBranch }) => {
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');

  useEffect(() => {
    if (existingBranch) {
      setBranchName(existingBranch.branch_name);
      setBranchAddress(existingBranch.branch_address);
      setBranchPhone(existingBranch.branch_phone || '');
    } else {
      // Reset form for "Add New"
      setBranchName('');
      setBranchAddress('');
      setBranchPhone('');
    }
  }, [existingBranch, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      branch_name: branchName, 
      branch_address: branchAddress,
      branch_phone: branchPhone 
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingBranch ? 'Edit Branch' : 'Add New Branch'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="branchName">Branch Name</label>
          <input
            id="branchName"
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg"
            placeholder="e.g., Phnom Penh - Head Office"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="branchAddress">Address</label>
          <input
            id="branchAddress"
            type="text"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg"
            placeholder="e.g., St 123, Boeung Keng Kang"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="branchPhone">Phone Number</label>
          <input
            id="branchPhone"
            type="text"
            value={branchPhone}
            onChange={(e) => setBranchPhone(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg"
            placeholder="e.g., 010-123-456"
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

export default BranchModal;
