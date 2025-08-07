import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        const [usersRes, suggestionsRes] = await Promise.all([
            axios.get('http://localhost:5001/api/admin/users', config),
            axios.get('http://localhost:5001/api/admin/suggestions', config)
        ]);

        setUsers(usersRes.data);
        setSuggestions(suggestionsRes.data);
        setLoading(false);
    } catch (err) {
        console.error("Failed to fetch admin data", err);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveSuggestion = async (suggestionId) => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`http://localhost:5001/api/admin/suggestions/${suggestionId}/approve`, {}, config);
        alert('Suggestion approved and remedial module assigned.');
        fetchData();
    } catch (err) {
        alert('Failed to approve suggestion.');
    }
  };

  const handleDismissSuggestion = async (suggestionId) => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`http://localhost:5001/api/admin/suggestions/${suggestionId}/dismiss`, {}, config);
        alert('Suggestion has been dismissed.');
        fetchData();
    } catch (err) {
        alert('Failed to dismiss suggestion.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete the user "${username}"?`)) {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, config);
            fetchData();
        } catch (err) {
            alert('Failed to delete user.');
        }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/';
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="dashboard-loading"><h1>Loading Admin Console...</h1></div>;

  return (
    <div className="admin-dashboard">
        <header className="dashboard-header">
            <h1>Admin Console</h1>
            <div className="header-controls">
                 <button onClick={() => window.location.href = '/admin/content'} className="analytics-button" style={{backgroundColor: '#16a085'}}>Content Manager</button>
                 <button onClick={() => window.location.href = '/admin/analytics'} className="analytics-button">View Analytics</button>
                 <input
                   type="text"
                   placeholder="Search by name or email..."
                   className="search-bar"
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
        </header>
        <main className="dashboard-main">
            {suggestions.length > 0 && (
                <div className="action-items-container">
                    <h2>Action Items: AI Suggestions</h2>
                    {suggestions.map(sugg => (
                        <div key={sugg._id} className="suggestion-card">
                            <div className="suggestion-text">
                                <p>
                                    <strong>{sugg.user.username}</strong> needs help with <strong>{sugg.failedTopic}</strong>.
                                </p>
                                <p><em><strong>AI Suggests:</strong> "{sugg.suggestedModuleTitle}"</em></p>
                                <p className="justification"><strong>Justification:</strong> {sugg.justification}</p>
                            </div>
                            <div className="action-buttons-container">
                                <button onClick={() => handleApproveSuggestion(sugg._id)} className="action-button">Approve</button>
                                <button onClick={() => handleDismissSuggestion(sugg._id)} className="action-button dismiss-button">Disapprove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="user-table-container">
                <h2>All Users</h2>
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
                                        <button onClick={() => window.location.href = `/admin/user/${user._id}`} className="action-button">Manage</button>
                                        <button onClick={() => window.location.href = `/admin/analytics/${user._id}`} className="action-button analytics-nav-button">Analytics</button>
                                        <button onClick={() => handleDeleteUser(user._id, user.username)} className="action-button delete-button">Delete</button>
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
