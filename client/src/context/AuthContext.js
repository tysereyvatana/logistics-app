import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define logout once and wrap it in useCallback to prevent re-creation
  const logout = useCallback(() => {
    const performLogout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error("Server logout failed, continuing client-side.", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            delete api.defaults.headers.common['Authorization'];
            navigate('/login');
        }
    };
    performLogout();
  }, [navigate]);

  // This effect runs only ONCE to set up the global error handler
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                console.log("Unauthorized or invalid session. Forcing logout.");
                // Use a stable logout function
                logout();
            }
            return Promise.reject(error);
        }
    );
    // On initial load, also check for a stored token to keep the user logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    // Cleanup function to remove the interceptor
    return () => {
        api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);


  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: loggedInUser } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(loggedInUser);
      if (loggedInUser.role === 'admin' || loggedInUser.role === 'staff') {
        navigate('/dashboard');
      } else if (loggedInUser.role === 'client') {
        navigate('/my-shipments');
      } else {
        navigate('/');
      }
    } catch (error) {
        alert(error.response?.data?.msg || 'Login failed. Please check your credentials.');
        console.error('Login failed:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
