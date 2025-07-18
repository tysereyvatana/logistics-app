import React, { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  const linkStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'background-color 0.3s, color 0.3s',
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600',
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              LogistiCo.
            </Link>
          </div>
          
          <nav className="hidden md:flex md:items-center md:space-x-2">
            <NavLink 
              to="/track" 
              style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
              className="text-gray-600 hover:bg-gray-100"
            >
              Track Shipment
            </NavLink>
            {/* Staff & Admin Links */}
            {user && (user.role === 'admin' || user.role === 'staff') && (
              <>
                <NavLink 
                  to="/dashboard" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/shipments" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Shipments
                </NavLink>
              </>
            )}
            {/* Admin Only Links */}
            {user && user.role === 'admin' && (
              <>
                <NavLink 
                  to="/reports" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Reports {/* <-- Added this link */}
                </NavLink>
                <NavLink 
                  to="/users" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Users
                </NavLink>
                <NavLink 
                  to="/rates" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Rates
                </NavLink>
                <NavLink 
                  to="/branches" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Branches
                </NavLink>
              </>
            )}
            {/* Client Links */}
            {user && user.role === 'client' && (
                <NavLink 
                  to="/my-shipments" 
                  style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  My Shipments
                </NavLink>
            )}
          </nav>

          <div className="flex items-center">
            {user ? (
              <>
                <span className="text-gray-600 mr-4 hidden sm:block">Welcome, {user.fullName}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
