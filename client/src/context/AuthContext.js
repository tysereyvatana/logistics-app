import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // --- NEW: State for the custom alert modal ---
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' });

  const isLoggingOut = useRef(false);

  // Function to show the custom alert
  const showAlert = (message) => {
    setAlertInfo({ isOpen: true, message });
  };

  // Function to close the custom alert
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: '' });
  };

  const logout = useCallback(() => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    const performLogout = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.post('/api/auth/logout');
        } catch (error) {
          console.error("Server logout call failed:", error);
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      
      navigate('/login');
      setTimeout(() => {
        isLoggingOut.current = false;
      }, 1000);
    };
    performLogout();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    let socket;

    if (token && storedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));

      try {
        const decodedToken = jwtDecode(token);
        const sessionId = decodedToken?.user?.sessionId;

        if (sessionId) {
          socket = io('http://localhost:5000');
          socket.emit('join_session_room', `session_${sessionId}`);
          socket.on('force_logout', (data) => {
            showAlert(data.msg); // Use custom alert
            logout();
          });
        }
      } catch (error) {
        showAlert("Invalid session token. Please log in again.");
        logout();
      }
    }

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const message = error.response.data.msg || "Your session has expired. Please log in again.";
          showAlert(message); // Use custom alert
          logout();
        }
        return Promise.reject(error);
      }
    );

    setLoading(false);

    return () => {
      api.interceptors.response.eject(responseInterceptor);
      if (socket) {
        socket.disconnect();
      }
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
      showAlert(error.response?.data?.msg || 'Login failed. Please check your credentials.');
      console.error('Login failed:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, alertInfo, closeAlert }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
