import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');

  // Effect to reset the form whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('client');
        setBranchId('');
        setBranches([]); // Clear previous branches
        setError('');
    }
  }, [isOpen]);

  // Effect to fetch branches only when the role is changed to staff or admin
  useEffect(() => {
    if (isOpen && (role === 'staff' || role === 'admin')) {
      const fetchBranches = async () => {
        try {
          const response = await api.get('/api/branches');
          setBranches(response.data);
        } catch (err) {
          console.error("Failed to fetch branches", err);
          setError("Could not load the branch list.");
        }
      };
      fetchBranches();
    } else {
      // If role is client, clear the branches
      setBranches([]);
      setBranchId('');
    }
  }, [role, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) {
      setError('All fields are required.');
      return;
    }
    if ((role === 'staff' || role === 'admin') && !branchId) {
        setError('Please assign a branch for this role.');
        return;
    }
    setError('');

    const newUser = { fullName, email, password, role, branch_id: branchId };
    try {
      await api.post('/api/auth/register', newUser);
      onUserAdded(); // This will trigger the real-time update
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create user.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User">
      <form onSubmit={handleSubmit}>
        {error && <p className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg bg-white">
              <option value="client">Client</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Show branch dropdown only for staff and admins */}
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
        </div>
        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className="mr-3 px-5 py-2.5 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg">Add User</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
