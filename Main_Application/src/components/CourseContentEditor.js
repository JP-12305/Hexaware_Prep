import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageUserPage.css'; 

const CourseContentEditor = () => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null); 

    const courseId = window.location.pathname.split('/').pop();

    const fetchCourse = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`http://localhost:5001/api/courses/${courseId}`, config);
            setCourse(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch course details", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const handleGenerateContent = async (moduleId) => {
        setGenerating(moduleId);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`http://localhost:5001/api/courses/${courseId}/modules/${moduleId}/generate-content`, {}, config);
            fetchCourse(); 
        } catch (err) {
            alert('Failed to generate content.');
        } finally {
            setGenerating(null);
        }
    };

    if (loading) return <div className="dashboard-loading"><h1>Loading Course Editor...</h1></div>;
    if (!course) return <div className="dashboard-loading"><h1>Course not found.</h1></div>;

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Content Editor: {course.name}</h1>
                <button onClick={() => window.location.href = '/admin/content'} className="back-button-analytics">Back to Content Manager</button>
            </header>
            <main className="dashboard-main">
                <div className="user-table-container">
                    <h2>Course Modules</h2>
                    <p>Generate learning materials for each module using the AI agent. The generated content will then be visible to learners.</p>
                    <ul className="task-list-analytics">
                        {course.modules.map(module => (
                            <li key={module._id} className="module-editor-item">
                                <div className="module-editor-header">
                                    <span>{module.title}</span>
                                    <button
                                        className="action-button-ai"
                                        onClick={() => handleGenerateContent(module._id)}
                                        disabled={generating === module._id || module.summary}
                                    >
                                        {generating === module._id ? 'Generating...' : (module.summary ? '✓ Content Added' : 'Generate Content')}
                                    </button>
                                </div>
                                {module.summary && (
                                    <div className="module-content-preview">
                                        <h4>Summary</h4>
                                        <p>{module.summary}</p>
                                        {module.video && module.video.youtube_id && (
                                            <>
                                                <h4>Video</h4>
                                                <a href={`https://www.youtube.com/watch?v=${module.video.youtube_id}`} target="_blank" rel="noopener noreferrer">{module.video.title}</a>
                                            </>
                                        )}
                                        {module.articles && module.articles.length > 0 && (
                                            <>
                                                <h4>Articles</h4>
                                                <ul>
                                                    {module.articles.map((article, index) => (
                                                        <li key={index}><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a></li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default CourseContentEditor;
