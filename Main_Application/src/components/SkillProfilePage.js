import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import './SkillProfilePage.css'; 

const SkillProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userId = window.location.pathname.split('/').pop();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get(`http://localhost:5001/api/admin/users/${userId}`, config);
                setUser(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch user data.');
                setLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    if (loading) return <div className="dashboard-loading"><h1>Loading Skill Profile...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Skill Profile for: {user.username}</h1>
                <button onClick={() => window.location.href = `/admin/analytics/${userId}`} className="back-button-analytics">Back to Analytics</button>
            </header>
            <main className="dashboard-main">
                <div className="user-table-container">
                    {user.skillProfile && user.skillProfile.length > 0 ? (
                        user.skillProfile.map(profile => (
                            <div key={profile._id} className="skill-profile-card">
                                <h2>{profile.skillName}</h2>
                                <ul className="topic-list">
                                    {profile.topics.map(topic => (
                                        <li key={topic._id} className={`topic-item ${topic.proficiency.replace(' ', '-').toLowerCase()}`}>
                                            <span className="topic-name">{topic.topicName}</span>
                                            <span className="topic-proficiency">{topic.proficiency}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p>No skill profile data available. The user may need to complete a proficiency assessment.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SkillProfilePage;
