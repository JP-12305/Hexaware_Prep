import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

const UserAnalyticsPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userId = window.location.pathname.split('/').pop();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get(`http://localhost:5001/api/admin/analytics/${userId}`, config);
                setUserData(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch user analytics.');
                setLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    if (loading) return <div className="dashboard-loading"><h1>Loading User Analytics...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    const taskStatusData = [
        { name: 'Completed Tasks', value: userData.completedTasks },
        { name: 'Pending Tasks', value: userData.pendingTasks },
    ];
    const COLORS = ['#2ecc71', '#e74c3c'];

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Analytics for: {userData.username}</h1>
                <button onClick={() => window.location.href = '/admin'} className="back-button-analytics">Back to User List</button>
            </header>
            <main className="dashboard-main analytics-main">
                <div className="analytics-cards-container">
                    <div className="analytics-card">
                        <h2>Learning Progress</h2>
                        <p>{userData.learningProgress}%</p>
                    </div>
                    <div className="analytics-card">
                        <h2>Tasks Completed</h2>
                        <p>{userData.completedTasks} / {userData.totalTasks}</p>
                    </div>
                </div>

                <div className="charts-container">
                    <div className="chart-wrapper">
                        <h3>Task Status Breakdown</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-wrapper">
                        <h3>Scheduled Task Details</h3>
                        <ul className="task-list-analytics">
                            {userData.assignedTasks.map(task => (
                                <li key={task._id} className={task.completed ? 'completed' : ''}>
                                    <span>{task.title}</span>
                                    <span>{task.completed ? '✓ Completed' : 'Pending'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserAnalyticsPage;
