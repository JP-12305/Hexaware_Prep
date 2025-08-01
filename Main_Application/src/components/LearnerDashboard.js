import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LearnerDashboard.css'; // A new CSS file for this page

const LearnerDashboard = () => {
    const [user, setUser] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo && userInfo.user) {
            setUser(userInfo.user);
        }

        const fetchDashboardData = async () => {
            try {
                const token = userInfo ? userInfo.token : null;
                if (!token) {
                    setError('Not authorized');
                    setLoading(false);
                    return;
                }
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('http://localhost:5001/api/dashboard', config);
                setDashboardData(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch dashboard data.');
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = '/';
    };

    const handleStartAssessment = () => {
        window.location.href = '/assessment';
    };

    if (loading) return <div className="dashboard-loading"><h1>Loading Dashboard...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        <div className="learner-dashboard">
            <header className="learner-header">
                <h1 className="logo">Learn Axis</h1>
                <div className="header-right">
                    <div className="notification-bell">🔔</div>
                    <div className="profile-menu" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <div className="profile-summary">
                            <span className="user-name">{user?.username}</span>
                            <span className="user-dept">{user?.department}</span>
                        </div>
                        <div className="profile-avatar"></div>
                        {isDropdownOpen && (
                            <div className="profile-dropdown">
                                <p><strong>Email:</strong> {user?.email}</p>
                                <p><strong>Emp ID:</strong> {user?.empId}</p>
                                <button onClick={handleLogout}>Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <main className="learner-main">
                <h2>WELCOME {user?.username?.toUpperCase()},</h2>

                {dashboardData?.proficiencyAssessmentStatus === 'pre-assessment-pending' ? (
                    <div className="assessment-prompt-card">
                        <h3>Pre-Assessment for "{dashboardData.currentCourse}"</h3>
                        <p>To personalize your learning path, please complete a short assessment on the first topic: <strong>{dashboardData.preAssessmentModuleTitle}</strong>.</p>
                        <button onClick={handleStartAssessment} className="start-assessment-button">Start Assessment</button>
                    </div>
                ) : (
                    <>
                        <div className="modules-container">
                            {dashboardData?.assignedTasks && dashboardData.assignedTasks.length > 0 ? (
                                dashboardData.assignedTasks.map((task, index) => (
                                    <div className="module-card" key={task._id}>
                                        <div className="module-header">
                                            <h3>WEEK {index + 1}</h3>
                                            <div className={`status-checkbox ${task.completed ? 'completed' : ''}`}>✓</div>
                                        </div>
                                        <div className="module-body">
                                            <h4>{task.title}</h4>
                                            <p>This module covers key concepts related to your role.</p>
                                            <p><strong>Role:</strong> {user?.role}</p>
                                        </div>
                                        <button 
                                            className="open-button"
                                            onClick={() => window.location.href = `/dashboard/task/${task._id}`}>
                                            OPEN →
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-modules-message">
                                    <p>No learning modules have been assigned to you yet.</p>
                                    <p>Please contact your administrator or manager.</p>
                                </div>
                            )}
                        </div>
                        <div className="progress-section">
                            <h3>Overall Progress</h3>
                            <div className="overall-progress-bar-container">
                                <div className="overall-progress-bar" style={{ width: `${dashboardData?.learningProgress}%` }}></div>
                            </div>
                            <span>{dashboardData?.learningProgress}%</span>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default LearnerDashboard;
