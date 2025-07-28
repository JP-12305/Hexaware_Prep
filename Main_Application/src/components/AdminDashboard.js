// src/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const EditUserModal = ({ user, onClose, onSave, departments }) => {
    const [role, setRole] = useState(user.role);
    const [department, setDepartment] = useState(user.department);
    const [availableRoles, setAvailableRoles] = useState([]);

    // This effect runs when the department changes
    useEffect(() => {
        const selectedDept = departments.find(d => d.name === department);
        if (selectedDept) {
            setAvailableRoles(selectedDept.roles);
            // If the user's current role is not valid for the new department, reset it
            if (!selectedDept.roles.includes(role)) {
                setRole(selectedDept.roles[0] || '');
            }
        } else {
            setAvailableRoles([]);
            setRole('');
        }
    }, [department, departments, role]);


    const [courseName, setCourseName] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');

    const handleSave = () => {
        onSave(user._id, { role, department });
    };

    const handleAssignCourse = () => {
        if (courseName) {
            axios.post(`http://localhost:5001/api/admin/users/${user._id}/assign-course`, { courseName }, getConfig())
                .then(() => {
                    alert('Course assigned!');
                    onClose();
                })
                .catch(err => console.error(err));
        }
    };

    const handleScheduleTask = () => {
        if (taskTitle && taskDueDate) {
            axios.post(`http://localhost:5001/api/admin/users/${user._id}/schedule-task`, { title: taskTitle, dueDate: taskDueDate }, getConfig())
                .then(() => {
                    alert('Task scheduled!');
                    onClose();
                })
                .catch(err => console.error(err));
        }
    };
    
    const getConfig = () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        return {
            headers: { Authorization: `Bearer ${userInfo.token}` }
        };
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Edit User: {user.username}</h2>
                
                <div className="modal-section">
                    <h4>User Details</h4>
                    <label>Department:</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)}>
                        <option value="Unassigned">Unassigned</option>
                        {departments.map(dept => (
                            <option key={dept._id} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>

                    <label>Role:</label>
                    <select value={role} onChange={e => setRole(e.target.value)} disabled={!availableRoles.length}>
                        <option value="Unassigned">Unassigned</option>
                        {availableRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <button onClick={handleSave} className="modal-button">Save Details</button>
                </div>

                <div className="modal-section">
                    <h4>Assign Course</h4>
                    <input type="text" placeholder="Enter Course Name" value={courseName} onChange={e => setCourseName(e.target.value)} />
                    <button onClick={handleAssignCourse} className="modal-button">Assign Course</button>
                </div>

                <div className="modal-section">
                    <h4>Schedule Task</h4>
                    <input type="text" placeholder="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                    <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                    <button onClick={handleScheduleTask} className="modal-button">Schedule Task</button>
                </div>

                <button onClick={onClose} className="modal-close-button">Close</button>
            </div>
        </div>
    );
};


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo ? userInfo.token : null;

      if (!token) {
        setError('Not authorized. Please log in.');
        setLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch both users and departments at the same time
      const [usersRes, deptsRes] = await Promise.all([
          axios.get('http://localhost:5001/api/admin/users', config),
          axios.get('http://localhost:5001/api/departments', config)
      ]);
      
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.msg : 'Error fetching data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveUser = async (userId, updatedData) => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`http://localhost:5001/api/admin/users/${userId}`, updatedData, config);
        setSelectedUser(null);
        fetchData(); // Re-fetch all data
    } catch (err) {
        console.error("Failed to update user", err);
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
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              className="search-bar"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                    <th>Current Course</th>
                    <th>Progress</th>
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
                      <td>{user.currentCourse}</td>
                      <td>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${user.learningProgress}%` }}>
                                {user.learningProgress}%
                            </div>
                        </div>
                      </td>
                      <td>
                        <button className="action-button" onClick={() => setSelectedUser(user)}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </main>
        {selectedUser && <EditUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onSave={handleSaveUser} departments={departments} />}
    </div>
  );
};

export default AdminDashboard;
