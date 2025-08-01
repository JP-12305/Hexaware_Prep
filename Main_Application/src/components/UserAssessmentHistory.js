// src/UserAssessmentHistory.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageUserPage.css';

const UserAssessmentHistory = () => {
    const [assessments, setAssessments] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const pathParts = window.location.pathname.split('/');
    const userId = pathParts[pathParts.length - 2]; 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                
                const [userRes, assessmentsRes] = await Promise.all([
                    axios.get(`http://localhost:5001/api/admin/users/${userId}`, config),
                    axios.get(`http://localhost:5001/api/admin/users/${userId}/assessments`, config)
                ]);

                setUser(userRes.data);
                setAssessments(assessmentsRes.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch assessment history.');
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) return <div className="dashboard-loading"><h1>Loading Assessment History...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Assessment History for: {user?.username}</h1>
                <button onClick={() => window.location.href = `/admin/user/${userId}`} className="back-button-analytics">Back to Manage User</button>
            </header>
            <main className="dashboard-main">
                <div className="user-table-container">
                    {assessments.length > 0 ? (
                        assessments.map(assessment => (
                            <div key={assessment._id} className="assessment-history-item">
                                <div className="assessment-summary" onClick={() => toggleExpand(assessment._id)}>
                                    <span><strong>Course:</strong> {assessment.courseName}</span>
                                    <span><strong>Score:</strong> {assessment.score}%</span>
                                    <span><strong>Date:</strong> {new Date(assessment.createdAt).toLocaleDateString()}</span>
                                    <span>{expandedId === assessment._id ? '▲ Collapse' : '▼ View Details'}</span>
                                </div>
                                {expandedId === assessment._id && (
                                    <div className="assessment-details">
                                        <h4>Questions & Answers:</h4>
                                        {assessment.questions.map((q, index) => (
                                            <div key={q._id} className="question-review">
                                                <p><strong>{index + 1}. {q.questionText}</strong></p>
                                                <ul>
                                                    {q.options.map((opt, i) => (
                                                        <li key={i} 
                                                            className={
                                                                opt === q.correctAnswer ? 'correct' : 
                                                                (opt === q.userAnswer ? 'incorrect' : '')
                                                            }>
                                                            {opt}
                                                            {opt === q.correctAnswer && <span> (Correct Answer)</span>}
                                                            {opt === q.userAnswer && opt !== q.correctAnswer && <span> (Your Answer)</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No completed assessments found for this user.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserAssessmentHistory;
