import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const ContentManager = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourses = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5001/api/courses', config);
            setCourses(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch courses.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5001/api/courses/${courseId}`, config);
                alert('Course deleted successfully.');
                fetchCourses();
            } catch (err) {
                alert('Failed to delete course.');
            }
        }
    };

    if (loading) return <div className="dashboard-loading"><h1>Loading Content Manager...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Content Management</h1>
                <button onClick={() => window.location.href = '/admin'} className="back-button-analytics">Back to Admin</button>
            </header>
            <main className="dashboard-main">
                <div className="user-table-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>All Courses</h2>
                        <button onClick={() => window.location.href = '/admin/content/ai-generator'} className="action-button">
                            Create Course with AI
                        </button>
                    </div>
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Course Name</th>
                                <th>Target Department</th>
                                <th>Target Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(course => (
                                <tr key={course._id}>
                                    <td>{course.name}</td>
                                    <td>{course.targetDepartment}</td>
                                    <td>{course.targetRole}</td>
                                    <td>
                                        <div className="action-buttons-container">
                                            <button 
                                                className="action-button"
                                                onClick={() => window.location.href = `/admin/content/editor/${course._id}`}
                                            >
                                                Manage Content
                                            </button>
                                            <button className="action-button delete-button" onClick={() => handleDeleteCourse(course._id)}>Delete</button>
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

export default ContentManager;
