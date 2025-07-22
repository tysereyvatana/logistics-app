import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getMe, logoutUser } from '../services/api';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' });
  const isLoggingOut = useRef(false);
  const socketRef = useRef(null);

  const showAlert = (message) => {
    setAlertInfo({ isOpen: true, message });
  };

  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: '' });
  };

  const logout = useCallback(() => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    const performLogout = async () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      try {
        await logoutUser();
      } catch (error) {
        console.error("Server logout call failed:", error);
      } finally {
        localStorage.removeItem('token');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
        setTimeout(() => {
          isLoggingOut.current = false;
        }, 500);
      }
    };
    performLogout();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const initializeAuth = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data: userData } = await getMe();
          setUser(userData);

          const decodedToken = jwtDecode(token);
          const sessionId = decodedToken?.user?.sessionId;

          if (sessionId && !socketRef.current) {
            const socket = io('http://localhost:5000');
            socketRef.current = socket;
            socket.emit('join_session_room', `session_${sessionId}`);
            socket.on('force_logout', (data) => {
              showAlert(data.msg);
              logout();
            });
          }
        } catch (error) {
          console.error("Authentication failed:", error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401 && !isLoggingOut.current) {
          const message = error.response.data.msg || "Your session has expired. Please log in again.";
          showAlert(message);
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { data: { token } } = await loginUser({ email, password });
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const { data: loggedInUser } = await getMe();
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
