import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

const InvoicePage = () => {
  const { id } = useParams(); // Get the shipment ID from the URL
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/shipments/${id}`);
        setShipment(response.data);
      } catch (err) {
        setError('Failed to fetch shipment details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  if (!shipment) return <div className="text-center mt-10">Shipment not found.</div>;

  const trackingUrl = `${window.location.origin}/track/${shipment.tracking_number}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link to="/shipments" className="text-blue-600 hover:underline">&larr; Back to Shipments</Link>
        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Print Invoice
        </button>
      </div>

      <div ref={invoiceRef} className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">LogistiCo.</h1>
            <p className="text-gray-500">INVOICE / RECEIPT</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm">{shipment.tracking_number}</p>
            <p className="text-sm text-gray-600">Date: {new Date(shipment.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Sender/Receiver */}
        <div className="grid grid-cols-2 gap-8 my-6">
          <div>
            <p className="text-sm font-bold uppercase text-gray-500 mb-2">SENDER</p>
            <p className="font-semibold">{shipment.sender_name}</p>
            <p className="text-gray-600">{shipment.origin_branch_name}</p>
            <p className="text-gray-600">{shipment.origin_branch_address}</p>
            <p className="text-gray-600">P: {shipment.sender_phone}</p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase text-gray-500 mb-2">RECEIVER</p>
            <p className="font-semibold">{shipment.receiver_name}</p>
            <p className="text-gray-600">{shipment.destination_branch_name}</p>
            <p className="text-gray-600">{shipment.destination_branch_address}</p>
            <p className="text-gray-600">P: {shipment.receiver_phone}</p>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-sm font-semibold uppercase">Description</th>
              <th className="p-3 text-sm font-semibold uppercase text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">
                <p className="font-medium">{shipment.service_type.charAt(0).toUpperCase() + shipment.service_type.slice(1)} Shipping</p>
                <p className="text-sm text-gray-500">Weight: {shipment.weight_kg} kg</p>
              </td>
              <td className="p-3 text-right font-medium">${parseFloat(shipment.price).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="p-3 text-right font-bold">TOTAL</td>
              <td className="p-3 text-right font-bold text-xl">${parseFloat(shipment.price).toFixed(2)}</td>
            </tr>
            {shipment.is_cod && (
              <tr className="bg-yellow-50">
                <td className="p-3 text-right font-bold text-yellow-800">CASH ON DELIVERY</td>
                <td className="p-3 text-right font-bold text-xl text-yellow-800">${parseFloat(shipment.cod_amount).toFixed(2)}</td>
              </tr>
            )}
          </tfoot>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-center mt-8 pt-4 border-t">
            <div className="text-center">
                <QRCodeSVG value={trackingUrl} size={128} />
                <p className="text-sm mt-2">Scan to track your shipment</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
