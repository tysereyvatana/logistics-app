import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import BranchModal from '../components/BranchModal'; // We will create this next

const BranchManagementPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/branches');
      setBranches(response.data);
    } catch (err) {
      setError('Failed to fetch branches.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSaveBranch = async (branchData) => {
    try {
      if (branchToEdit) {
        // Update existing branch
        const response = await api.put(`/api/branches/${branchToEdit.id}`, branchData);
        setBranches(branches.map(b => b.id === branchToEdit.id ? response.data : b));
      } else {
        // Create new branch
        const response = await api.post('/api/branches', branchData);
        setBranches([...branches, response.data]);
      }
      closeModal();
    } catch (err) {
      alert('Failed to save branch.');
      console.error(err);
    }
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      await api.delete(`/api/branches/${branchToDelete.id}`);
      setBranches(branches.filter(b => b.id !== branchToDelete.id));
      setBranchToDelete(null);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Branches</h1>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
          >
            + Add New Branch
          </button>
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
              {branches.map((branch) => (
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
          </table>
        </div>
      </div>
    </>
  );
};

export default BranchManagementPage;
