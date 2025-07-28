// src/ManageUserPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageUserPage.css';

const ManageUserPage = () => {
    const [user, setUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [allCourses, setAllCourses] = useState([]); // All courses from the DB
    const [filteredCourses, setFilteredCourses] = useState([]); // Courses filtered by role/dept
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the editable fields
    const [role, setRole] = useState('');
    const [department, setDepartment] = useState('');
    const [availableRoles, setAvailableRoles] = useState([]);
    const [courseName, setCourseName] = useState('');

    const userId = window.location.pathname.split('/')[3];

    const fetchData = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            const [userRes, deptsRes, coursesRes] = await Promise.all([
                axios.get(`http://localhost:5001/api/admin/users/${userId}`, config),
                axios.get('http://localhost:5001/api/departments', config),
                axios.get('http://localhost:5001/api/courses', config)
            ]);

            setUser(userRes.data);
            setDepartments(deptsRes.data);
            setAllCourses(coursesRes.data);
            setRole(userRes.data.role);
            setDepartment(userRes.data.department);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    // This effect updates the list of available roles when the department changes
    useEffect(() => {
        const selectedDept = departments.find(d => d.name === department);
        if (selectedDept) {
            setAvailableRoles(selectedDept.roles);
            if (!selectedDept.roles.includes(role)) {
                setRole(selectedDept.roles[0] || '');
            }
        } else {
            setAvailableRoles([]);
        }
    }, [department, departments, role]);

    // --- NEW: This effect filters courses based on the selected department and role ---
    useEffect(() => {
        if (department && role) {
            const relevantCourses = allCourses.filter(course => 
                course.targetDepartment === department && course.targetRole === role
            );
            setFilteredCourses(relevantCourses);
            // Set the default selection to the first available course, or none if empty
            setCourseName(relevantCourses.length > 0 ? relevantCourses[0].name : '');
        }
    }, [department, role, allCourses]);


    const handleSaveChanges = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5001/api/admin/users/${userId}`, { role, department }, config);
            alert('User details saved!');
            fetchData();
        } catch (err) {
            alert('Failed to save changes.');
        }
    };
    
    const handleAssignCourse = async () => {
        if (!courseName) return alert('No course is available or selected for this role.');
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`http://localhost:5001/api/admin/users/${userId}/assign-course`, { courseName }, config);
            alert('Course assigned successfully!');
            fetchData();
        } catch (err) {
            alert('Failed to assign course.');
        }
    };

    const handleRemoveTask = async (taskId) => {
        if (window.confirm('Are you sure you want to remove this task?')) {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5001/api/admin/users/${userId}/tasks/${taskId}`, config);
                alert('Task removed successfully!');
                fetchData();
            } catch (err) {
                alert('Failed to remove task.');
            }
        }
    };

    const handleRemoveCourse = async () => {
        if (window.confirm(`Are you sure you want to remove the course "${user.currentCourse}" from this user? Their progress and tasks will be reset.`)) {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5001/api/admin/users/${userId}/assign-course`, config);
                alert('Course removed successfully.');
                fetchData();
            } catch (err) {
                alert('Failed to remove course.');
            }
        }
    };

    const handleAiSuggest = () => {
        alert(`AI Agent: Suggesting learning path for a ${role} in the ${department} department.`);
    };

    const handleGenerateReport = () => {
        alert(`Generating performance report for ${user.username}...`);
    };

    if (loading) return <div className="dashboard-loading"><h1>Loading User Details...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        <div className="manage-user-page">
            <header className="manage-user-header">
                <h1>Manage User: {user.username}</h1>
                <button onClick={() => window.location.href = '/admin'} className="back-button">Back to Dashboard</button>
            </header>
            <main className="manage-user-main">
                {/* User Details & Role Management Card */}
                <div className="card">
                    <h3>User Details & Role</h3>
                    <div className="form-group">
                        <label>Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)}>
                            {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} disabled={!availableRoles.length}>
                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSaveChanges} className="action-button">Save Changes</button>
                </div>

                {/* Course Management Card */}
                <div className="card">
                    <h3>Course Management</h3>
                    <div className="form-group">
                        <label>Assign New Course</label>
                        <select value={courseName} onChange={e => setCourseName(e.target.value)} disabled={filteredCourses.length === 0}>
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <option key={course._id} value={course.name}>{course.name}</option>
                                ))
                            ) : (
                                <option>No courses available for this role</option>
                            )}
                        </select>
                        <button onClick={handleAssignCourse} className="action-button-secondary" disabled={filteredCourses.length === 0}>
                            Assign Course
                        </button>
                    </div>
                </div>

                {/* Scheduled Tasks Card */}
                <div className="card">
                    <h3>Scheduled Tasks</h3>
                    <ul className="task-list">
                        {user.assignedTasks && user.assignedTasks.length > 0 ? (
                            user.assignedTasks.map(task => (
                                <li key={task._id} className="task-item">
                                    <span>
                                        <strong>{task.title}</strong> (Due: {new Date(task.dueDate).toLocaleDateString()})
                                    </span>
                                    <button onClick={() => handleRemoveTask(task._id)} className="remove-button">Remove</button>
                                </li>
                            ))
                        ) : (
                            <p>No tasks scheduled for this user.</p>
                        )}
                    </ul>
                </div>
                
                {/* Progress & Reporting Card */}
                <div className="card">
                    <h3>Progress & Reporting</h3>
                    <div className="course-info">
                        <p><strong>Current Course:</strong> {user.currentCourse}</p>
                        {user.currentCourse !== 'None' && (
                            <button onClick={handleRemoveCourse} className="remove-button-small">Remove Course</button>
                        )}
                    </div>
                    <label>Learning Progress: {user.learningProgress}%</label>
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${user.learningProgress}%` }}></div>
                    </div>
                    <button onClick={handleGenerateReport} className="action-button">Generate Report</button>
                </div>
                
                {/* Completed Course History Card */}
                <div className="card">
                    <h3>Completed Course History</h3>
                    <ul className="task-list">
                        {user.completedCourses && user.completedCourses.length > 0 ? (
                            user.completedCourses.map(course => (
                                <li key={course._id} className="task-item">
                                    <span>
                                        <strong>{course.courseName}</strong> (Completed: {new Date(course.completedDate).toLocaleDateString()})
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p>No courses completed yet.</p>
                        )}
                    </ul>
                </div>

                {/* AI Agent Integration Card */}
                <div className="card ai-card">
                   <h3>AI Learning Assistant (Gemini)</h3>
                    <p>Use AI to generate a personalized learning path based on the user's role and department.</p>
                    <button onClick={handleAiSuggest} className="action-button-ai">Suggest Learning Path</button>
                </div>
            </main>
        </div>
    );
};

export default ManageUserPage;
