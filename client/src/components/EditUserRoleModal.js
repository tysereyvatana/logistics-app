import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

const EditUserRoleModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [role, setRole] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);

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
    if (user) {
      setRole(user.role);
      setBranchId(user.branch_id || '');
    }
  }, [user, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUserUpdated(user.id, { role, branch_id: branchId });
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Role for ${user.full_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg bg-white">
            <option value="client">Client</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {(role === 'staff' || role === 'admin') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg bg-white" required>
                <option value="" disabled>-- Select a Branch --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                ))}
              </select>
            </div>
        )}
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-5 py-2.5 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserRoleModal;
