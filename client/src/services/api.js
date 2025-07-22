import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Using the proxy, so just need the /api prefix
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const getMe = () => api.get('/auth/me');
export const logoutUser = () => api.post('/auth/logout');

// Shipment API calls
export const getShipments = () => api.get('/shipments');
export const createShipment = (shipmentData) => api.post('/shipments', shipmentData);
export const updateShipment = (id, shipmentData) => api.put(`/shipments/${id}`, shipmentData);
export const deleteShipment = (id) => api.delete(`/shipments/${id}`);
export const trackShipment = (trackingNumber) => api.get(`/shipments/track/${trackingNumber}`);

// User API calls
export const getUsers = () => api.get('/users');
export const updateUserRole = (id, role) => api.put(`/users/${id}/role`, { role });
export const addUser = (userData) => api.post('/users', userData);

// Branch API calls
export const getBranches = () => api.get('/branches');
export const addBranch = (branchData) => api.post('/branches', branchData);
export const updateBranch = (id, branchData) => api.put(`/branches/${id}`, branchData);
export const deleteBranch = (id) => api.delete(`/branches/${id}`);

// Rate API calls
export const getRates = () => api.get('/rates');
export const addRate = (rateData) => api.post('/rates', rateData);
export const updateRate = (id, rateData) => api.put(`/rates/${id}`, rateData);
export const deleteRate = (id) => api.delete(`/rates/${id}`);

// Report API calls
export const getReports = (queryParams) => api.get('/reports', { params: queryParams });

// Update API calls
export const addUpdate = (updateData) => api.post('/updates', updateData);

export default api;
