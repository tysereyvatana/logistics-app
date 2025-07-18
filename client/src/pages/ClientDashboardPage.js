import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import PrintLabelModal from '../components/PrintLabelModal'; // 1. Import the modal

const ClientDashboardPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  // 2. Add state to manage the print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchMyShipments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/shipments/my-shipments');
        setShipments(response.data);
      } catch (err) {
        setError('Could not fetch your shipments.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyShipments();
  }, [user]);

  // 3. Function to open the print modal
  const openPrintModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsPrintModalOpen(true);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      {/* 4. Render the modal component */}
      <PrintLabelModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shipment={selectedShipment}
      />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">My Shipments</h1>
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shipments.length > 0 ? (
                  shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          <Link to={`/track/${shipment.tracking_number}`} className="hover:underline">{shipment.tracking_number}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.origin_branch_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.destination_branch_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                          shipment.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">${parseFloat(shipment.price).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {shipment.is_cod ? (
                          <span className="font-bold text-green-600">Yes (${parseFloat(shipment.cod_amount).toFixed(2)})</span>
                        ) : (
                          <span>No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        {/* 5. Update the action buttons */}
                        <span className="text-indigo-600 opacity-50 cursor-not-allowed">Edit</span>
                        <Link to={`/invoice/${shipment.id}`} className="text-green-600 hover:text-green-900">Invoice</Link>
                        <button onClick={() => openPrintModal(shipment)} className="text-gray-600 hover:text-gray-900">Print</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      You have no shipments assigned to your account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboardPage;
