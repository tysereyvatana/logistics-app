import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import RateModal from '../components/RateModal'; // We will create this next

const RateManagementPage = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for modals
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateToEdit, setRateToEdit] = useState(null);
  const [rateToDelete, setRateToDelete] = useState(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/rates');
      setRates(response.data);
    } catch (err) {
      setError('Failed to fetch service rates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSaveRate = async (rateData) => {
    try {
      if (rateToEdit) {
        // Update existing rate
        const response = await api.put(`/api/rates/${rateToEdit.id}`, rateData);
        setRates(rates.map(r => r.id === rateToEdit.id ? response.data : r));
      } else {
        // Create new rate
        const response = await api.post('/api/rates', rateData);
        setRates([...rates, response.data]);
      }
      closeModal();
    } catch (err) {
      alert('Failed to save rate.');
      console.error(err);
    }
  };

  const handleDeleteRate = async () => {
    if (!rateToDelete) return;
    try {
      await api.delete(`/api/rates/${rateToDelete.id}`);
      setRates(rates.filter(r => r.id !== rateToDelete.id));
      setRateToDelete(null);
    } catch (err) {
      alert('Failed to delete rate.');
      console.error(err);
    }
  };

  const openModal = (rate = null) => {
    setRateToEdit(rate);
    setIsRateModalOpen(true);
  };

  const closeModal = () => {
    setRateToEdit(null);
    setIsRateModalOpen(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      <RateModal
        isOpen={isRateModalOpen}
        onClose={closeModal}
        onSave={handleSaveRate}
        existingRate={rateToEdit}
      />
      <ConfirmationModal
        isOpen={!!rateToDelete}
        onClose={() => setRateToDelete(null)}
        onConfirm={handleDeleteRate}
        title="Delete Service Rate"
        message={`Are you sure you want to delete the "${rateToDelete?.service_name}" service? This cannot be undone.`}
      />
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Service Rates</h1>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
          >
            + Add New Rate
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.service_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">${parseFloat(rate.base_rate).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => openModal(rate)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => setRateToDelete(rate)} className="text-red-600 hover:text-red-900">Delete</button>
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

export default RateManagementPage;
