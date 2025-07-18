// // import axios from 'axios';

// // // Create an instance of axios
// // const api = axios.create({
// //   // The "proxy" in package.json will automatically handle the base URL in development
// //   baseURL: '/', 
// //   headers: {
// //     'Content-Type': 'application/json',
// //   },
// // });

// // export default api;

import axios from 'axios';

// Create an instance of axios.
// We are using baseURL: '/' because your project's "proxy" setting
// correctly handles sending requests to your backend.
const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// CRITICAL FIX: This part was missing.
// This "interceptor" automatically adds your login token to every single
// API request you make. This is required for all protected pages.
api.interceptors.request.use(
  (config) => {
    // Get the token from where it's stored after login
    const token = localStorage.getItem('token');
    if (token) {
      // If the token exists, add it to the 'Authorization' header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
