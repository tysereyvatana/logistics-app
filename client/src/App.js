import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthContext, { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TrackingPage from './pages/TrackingPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClientDashboardPage from './pages/ClientDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import RateManagementPage from './pages/RateManagementPage';
import BranchManagementPage from './pages/BranchManagementPage';
import InvoicePage from './pages/InvoicePage';
import ReportsPage from './pages/ReportsPage';
import AlertModal from './components/AlertModal';

const AppContent = () => {
  const { alertInfo, closeAlert } = useContext(AuthContext);

  return (
    <>
      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={closeAlert}
        title="Logistic Application"
        message={alertInfo.message}
      />
      <Navbar />
      <main className="container mx-auto mt-8 p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<TrackingPage />} />
          {/* --- FIX IS HERE --- */}
          {/* The route now accepts a tracking number parameter */}
          <Route path="/track/:trackingNumber" element={<TrackingPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin Only Routes */}
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/rates" element={<RateManagementPage />} />
            <Route path="/branches" element={<BranchManagementPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            
            {/* Staff & Admin Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/invoice/:id" element={<InvoicePage />} />

            {/* Client Route */}
            <Route path="/my-shipments" element={<ClientDashboardPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
