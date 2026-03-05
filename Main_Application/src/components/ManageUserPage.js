import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManageUserPage.css';

const ManageUserPage = () => {
    const [user, setUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedDept, setSelectedDept] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('');
    
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    
    const [courseName, setCourseName] = useState('');

    const userId = window.location.pathname.split('/')[3];

    // Wrapped in useCallback to resolve dependency warning
    const fetchData = useCallback(async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            const [userRes, deptsRes, coursesRes] = await Promise.all([
                axios.get(`http://localhost:5001/api/admin/users/${userId}`, config),
                axios.get('http://localhost:5001/api/departments', config),
                axios.get('http://localhost:5001/api/courses', config)
            ]);

            const userData = userRes.data;
            const deptsData = deptsRes.data;

            setUser(userData);
            setDepartments(deptsData);
            setAllCourses(coursesRes.data);
            
            setSelectedDept(userData.department);
            
            const currentDept = deptsData.find(d => d.name === userData.department);
            if (currentDept) {
                const currentCat = currentDept.roles.find(r => r.skills.includes(userData.role));
                if (currentCat) {
                    setSelectedCategory(currentCat.category);
                }
            }
            setSelectedSkill(userData.role);

            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const dept = departments.find(d => d.name === selectedDept);
        if (dept) {
            const newCategories = dept.roles.map(r => r.category);
            setAvailableCategories(newCategories);
            if (!newCategories.includes(selectedCategory)) {
                setSelectedCategory(newCategories[0] || '');
            }
        }
    }, [selectedDept, departments, selectedCategory]);

    useEffect(() => {
        const dept = departments.find(d => d.name === selectedDept);
        if (dept) {
            const roleCategory = dept.roles.find(r => r.category === selectedCategory);
            if (roleCategory) {
                const newSkills = roleCategory.skills;
                setAvailableSkills(newSkills);
                if (!newSkills.includes(selectedSkill)) {
                    setSelectedSkill(newSkills[0] || '');
                }
            }
        }
    }, [selectedCategory, selectedDept, departments, selectedSkill]);
    
    useEffect(() => {
        if (selectedDept && selectedSkill) {
            const relevantCourses = allCourses.filter(course => 
                course.targetDepartment === selectedDept && course.targetRole === selectedSkill
            );
            setFilteredCourses(relevantCourses);
            setCourseName(relevantCourses.length > 0 ? relevantCourses[0].name : '');
        }
    }, [selectedDept, selectedSkill, allCourses]);

    const handleSaveChanges = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5001/api/admin/users/${userId}`, { department: selectedDept, role: selectedSkill }, config);
            alert('User details saved!');
            fetchData();
        } catch (err) {
            alert('Failed to save changes.');
        }
    };

    const handleAssignCourse = async () => {
        if (!courseName) return alert('No course is available or selected for this Skill.');
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
        if (window.confirm(`Are you sure you want to remove the course "${user.currentCourse}"?`)) {
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
                <div className="card">
                    <h3>User Details & Role</h3>
                    <div className="form-group">
                        <label>Department</label>
                        <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                            {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Role Category</label>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={!availableCategories.length}>
                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Skill / Specialization</label>
                        <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} disabled={!availableSkills.length}>
                            {availableSkills.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSaveChanges} className="action-button">Save Changes</button>
                </div>

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
                                <option>No courses available</option>
                            )}
                        </select>
                        <button onClick={handleAssignCourse} className="action-button-secondary" disabled={filteredCourses.length === 0}>
                            Assign Course
                        </button>
                    </div>
                </div>
                
                <div className="card">
                    <h3>Scheduled Tasks</h3>
                    <ul className="task-list">
                        {user.assignedTasks && user.assignedTasks.length > 0 ? (
                            user.assignedTasks.map(task => (
                                <li key={task._id} className="task-item">
                                    <span><strong>{task.title}</strong></span>
                                    <button onClick={() => handleRemoveTask(task._id)} className="remove-button">Remove</button>
                                </li>
                            ))
                        ) : (
                            <p>No tasks scheduled.</p>
                        )}
                    </ul>
                </div>
                
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
            </main>
        </div>
    );
};

export default ManageUserPage;