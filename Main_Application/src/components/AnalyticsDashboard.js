import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css'; 

const AnalyticsDashboard = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('http://localhost:5001/api/admin/analytics', config);
                setAnalyticsData(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch analytics data.');
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="dashboard-loading"><h1>Loading Analytics...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    // Prepare data for charts
    const deptUserData = analyticsData.usersByDepartment.map(item => ({ name: item._id, Users: item.count }));
    const deptProgressData = analyticsData.avgProgressByDept.map(item => ({ name: item._id, 'Avg Progress': Math.round(item.avgProgress) }));

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Visual Analytics & Reporting</h1>
                <button onClick={() => window.location.href = '/admin'} className="back-button-analytics">Back to User List</button>
            </header>
            <main className="dashboard-main analytics-main">
                {/* Key Metrics Cards */}
                <div className="analytics-cards-container">
                    <div className="analytics-card">
                        <h2>Total Users</h2>
                        <p>{analyticsData.totalUsers}</p>
                    </div>
                    <div className="analytics-card">
                        <h2>Overall Average Progress</h2>
                        <p>{Math.round(analyticsData.overallAvgProgress)}%</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="charts-container">
                    <div className="chart-wrapper">
                        <h3>Users per Department</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={deptUserData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Users" fill="#3498db" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-wrapper">
                        <h3>Average Progress per Department (%)</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={deptProgressData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Avg Progress" fill="#2ecc71" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AnalyticsDashboard;
