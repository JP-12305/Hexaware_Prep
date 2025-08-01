// src/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5001/api/admin/users', config);
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.msg : 'Error fetching users');
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/';
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, config);
            alert('User deleted successfully.');
            fetchUsers(); // Re-fetch users to update the list
        } catch (err) {
            alert('Failed to delete user.');
        }
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const usernameMatch = user.username && user.username.toLowerCase().includes(term);
    const emailMatch = user.email && user.email.toLowerCase().includes(term);
    const departmentMatch = user.department && user.department.toLowerCase().includes(term);
    return usernameMatch || emailMatch || departmentMatch;
  });

  if (loading) return <div className="dashboard-loading"><h1>Loading Admin Console...</h1></div>;
  if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

  return (
    <div className="admin-dashboard">
        <header className="dashboard-header">
          <h1>Admin Console</h1>
          <div> {/* Wrapper for buttons */}
              <button 
                  onClick={() => window.location.href = '/admin/content'} 
                  className="analytics-button" style={{backgroundColor: '#16a085'}}>
                  Content Manager
              </button>
              <button 
                  onClick={() => window.location.href = '/admin/analytics'} 
                  className="analytics-button">
                  View Analytics
              </button>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            className="search-bar"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
               
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </header>
        <main className="dashboard-main">
            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.department}</td>
                      <td>{user.role}</td>
                      <td>
                        <div className="action-buttons-container">
                            <button 
                              className="action-button" 
                              onClick={() => window.location.href = `/admin/user/${user._id}`}>
                              Manage
                            </button>
                            {/* ADD THIS NEW BUTTON */}
                            <button 
                              className="action-button analytics-nav-button"
                              onClick={() => window.location.href = `/admin/analytics/${user._id}`}>
                              Analytics
                            </button>
                            <button 
                              className="action-button delete-button"
                              onClick={() => handleDeleteUser(user._id, user.username)}>
                              Delete
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </main>
    </div>
  );
};

export default AdminDashboard;
