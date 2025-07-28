// src/TaskDetailPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LearnerDashboard.css'; // We can reuse styles

const TaskDetailPage = () => {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const taskId = window.location.pathname.split('/')[3];

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                // We need to fetch the full user dashboard data to find the task
                const { data } = await axios.get('http://localhost:5001/api/dashboard', config);
                const currentTask = data.assignedTasks.find(t => t._id === taskId);
                if (currentTask) {
                    setTask(currentTask);
                } else {
                    setError('Task not found.');
                }
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch task details.');
                setLoading(false);
            }
        };
        fetchTask();
    }, [taskId]);

    const handleMarkComplete = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5001/api/dashboard/tasks/${taskId}/complete`, {}, config);
            alert('Module marked as complete! Your progress has been updated.');
            window.location.href = '/dashboard'; // Go back to the dashboard
        } catch (err) {
            alert('Failed to update task.');
        }
    };

    if (loading) return <div className="dashboard-loading"><h1>Loading Module...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        <div className="learner-dashboard">
            <header className="learner-header">
                <h1 className="logo">Learn Axis</h1>
                <button className="back-button-learner" onClick={() => window.location.href = '/dashboard'}>← Back to Dashboard</button>
            </header>
            <main className="learner-main">
                <div className="task-detail-card">
                    <h1>{task.title}</h1>
                    <div className="task-content">
                        <h3>Module Summary</h3>
                        <p>{task.summary || "No summary available for this module yet."}</p>

                        {task.video && task.video.youtube_id && (
                            <div className="video-container">
                                <h3>Featured Video: {task.video.title}</h3>
                                <iframe
                                    width="560"
                                    height="315"
                                    src={`https://www.youtube.com/embed/${task.video.youtube_id}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen>
                                </iframe>
                            </div>
                        )}

                        {task.articles && task.articles.length > 0 && (
                            <div className="articles-container">
                                <h3>Recommended Articles</h3>
                                <ul>
                                    {task.articles.map((article, index) => (
                                        <li key={index}>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {!task.completed && (
                        <button className="complete-button" onClick={handleMarkComplete}>
                            Mark as Complete
                        </button>
                    )}
                    {task.completed && (
                        <p className="completion-message">✓ You have already completed this module.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TaskDetailPage;
