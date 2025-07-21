import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import EditUserRoleModal from '../components/EditUserRoleModal';
import AddUserModal from '../components/AddUserModal';
import { io } from 'socket.io-client';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const socketRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join_users_room');
    });

    const handleUpdate = () => {
      fetchUsers();
    };

    socket.on('users_updated', handleUpdate);

    return () => {
      socket.off('users_updated', handleUpdate);
      socket.disconnect();
    };
  }, [fetchUsers]);

  const handleUserAdded = () => {
    setIsAddModalOpen(false);
    fetchUsers(); // Manually refetch for instant feedback
  };

  const handleUpdateUserRole = async (userId, data) => {
    try {
      await api.put(`/api/users/${userId}/role`, data);
      setUserToEdit(null);
      fetchUsers(); // Manually refetch for instant feedback
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update user role.');
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      setUserToDelete(null);
      fetchUsers(); // Manually refetch for instant feedback
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete user.');
      console.error(err);
      setUserToDelete(null);
    }
  };

  const openEditModal = (user) => setUserToEdit(user);
  const openDeleteModal = (user) => {
    if (currentUser.id === user.id) {
      alert("You cannot delete your own account.");
      return;
    }
    setUserToDelete(user);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center mt-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <>
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
      <EditUserRoleModal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        user={userToEdit}
        onUserUpdated={handleUpdateUserRole}
      />
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete the user "${userToDelete?.full_name}"?`}
      />
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" /></svg>
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.branch_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    {currentUser.id !== user.id && (
                      <>
                        <button onClick={() => openEditModal(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => openDeleteModal(user)} className="text-red-600 hover:text-red-900">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
