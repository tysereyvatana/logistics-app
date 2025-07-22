import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DriverDashboardPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get('/api/shipments/my-assignments');
      setAssignments(response.data);
    } catch (err) {
      setError('Failed to fetch assignments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleUpdateStatus = async (shipmentId, action, location) => {
    const endpoint = action === 'pickup' ? `/api/shipments/${shipmentId}/pickup` : `/api/shipments/${shipmentId}/deliver`;
    try {
      await api.put(endpoint, { location });
      toast.success(`Shipment status updated successfully!`);
      fetchAssignments(); // Re-fetch to update the list
    } catch (err) {
      toast.error('Failed to update status.');
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">My Assignments</h1>
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((shipment) => (
                <tr key={shipment.id}>
                  <td className="px-6 py-4">{shipment.tracking_number}</td>
                  <td className="px-6 py-4">{shipment.origin_branch_name}</td>
                  <td className="px-6 py-4">{shipment.destination_branch_name}</td>
                  <td className="px-6 py-4">{shipment.status}</td>
                  <td className="px-6 py-4 space-x-2">
                    {shipment.status === 'pending' && (
                      <button onClick={() => handleUpdateStatus(shipment.id, 'pickup', shipment.origin_branch_name)} className="px-3 py-1 bg-blue-500 text-white rounded">Mark as In Transit</button>
                    )}
                    {shipment.status === 'in_transit' && (
                      <button onClick={() => handleUpdateStatus(shipment.id, 'deliver', shipment.destination_branch_name)} className="px-3 py-1 bg-green-500 text-white rounded">Mark as Delivered</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboardPage;
