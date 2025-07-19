import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import BranchModal from '../components/BranchModal';
import { io } from 'socket.io-client';

const BranchManagementPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- NEW: State for the search filter ---
  const [searchTerm, setSearchTerm] = useState('');

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const socketRef = useRef(null);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await api.get('/api/branches');
      setBranches(response.data);
    } catch (err) {
      setError('Failed to fetch branches.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();

    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[BranchManagementPage] Socket connected, joining branches_room...');
      socket.emit('join_branches_room');
    });

    const handleUpdate = () => {
      console.log('[BranchManagementPage] Received branches_updated event. Refetching data...');
      fetchBranches();
    };

    socket.on('branches_updated', handleUpdate);

    return () => {
      console.log('[BranchManagementPage] Disconnecting socket.');
      socket.off('branches_updated', handleUpdate);
      socket.disconnect();
    };
  }, [fetchBranches]);

  const handleSaveBranch = async (branchData) => {
    try {
      if (branchToEdit) {
        await api.put(`/api/branches/${branchToEdit.id}`, branchData);
      } else {
        await api.post('/api/branches', branchData);
      }
      closeModal();
      fetchBranches();
    } catch (err) {
      alert('Failed to save branch.');
      console.error(err);
    }
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      await api.delete(`/api/branches/${branchToDelete.id}`);
      setBranchToDelete(null);
      fetchBranches();
    } catch (err) {
      alert('Failed to delete branch. It might be in use by a shipment.');
      console.error(err);
    }
  };

  const openModal = (branch = null) => {
    setBranchToEdit(branch);
    setIsBranchModalOpen(true);
  };

  const closeModal = () => {
    setBranchToEdit(null);
    setIsBranchModalOpen(false);
  };

  // --- NEW: Filter logic for the search bar ---
  const filteredBranches = branches.filter(branch => {
    const term = searchTerm.toLowerCase();
    const numericTerm = searchTerm.replace(/\D/g, '');

    if (!searchTerm) return true;

    if (branch.branch_name && branch.branch_name.toLowerCase().includes(term)) return true;
    if (branch.branch_address && branch.branch_address.toLowerCase().includes(term)) return true;
    if (numericTerm && branch.branch_phone && branch.branch_phone.replace(/\D/g, '').includes(numericTerm)) return true;
    
    return false;
  });

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={closeModal}
        onSave={handleSaveBranch}
        existingBranch={branchToEdit}
      />
      <ConfirmationModal
        isOpen={!!branchToDelete}
        onClose={() => setBranchToDelete(null)}
        onConfirm={handleDeleteBranch}
        title="Delete Branch"
        message={`Are you sure you want to delete the "${branchToDelete?.branch_name}" branch? This cannot be undone.`}
      />
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 self-start md:self-center">Manage Branches</h1>
            <button 
              onClick={() => openModal()}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              + Add New Branch
            </button>
          </div>
          <div className="w-full md:w-1/2 lg:w-1/3">
            <input
              type="text"
              placeholder="Search by Name, Address, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branch_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{branch.branch_address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{branch.branch_phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => openModal(branch)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => setBranchToDelete(branch)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* --- NEW: Table Footer with Total Count --- */}
            <tfoot className="bg-gray-50">
                <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                        Total Branches: {filteredBranches.length}
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
};

export default BranchManagementPage;
