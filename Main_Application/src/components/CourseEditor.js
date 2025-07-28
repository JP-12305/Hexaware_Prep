import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageUserPage.css';

const CourseEditor = () => {
    const [departments, setDepartments] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [targetDepartment, setTargetDepartment] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('http://localhost:5001/api/departments', config);
                setDepartments(data);
                if (data.length > 0) {
                    setTargetDepartment(data[0].name);
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch departments");
                setLoading(false);
            }
        };
        fetchDepts();
    }, []);

    useEffect(() => {
        const selectedDept = departments.find(d => d.name === targetDepartment);
        if (selectedDept) {
            setAvailableRoles(selectedDept.roles);
            setTargetRole(selectedDept.roles[0] || '');
        }
    }, [targetDepartment, departments]);

    const handleSaveCourse = async () => {
        if (!name || !targetDepartment || !targetRole) {
            return alert('Please fill in all required fields.');
        }
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const courseData = { name, description, targetDepartment, targetRole };
            await axios.post('http://localhost:5001/api/courses', courseData, config);
            alert('Course structure saved successfully!');
            window.location.href = '/admin/content';
        } catch (err) {
            alert('Failed to save course.');
        }
    };

    const handleAIGenerate = () => {
        if (!name || !targetRole) {
            return alert('Please provide a Course Name and Target Role before generating content.');
        }
        alert(`AI Agent (Gemini) is now generating content for the course "${name}" for the role of a ${targetRole}. This will take a moment...`);
    };
    
    if (loading) return <div className="dashboard-loading"><h1>Loading Editor...</h1></div>;

    return (
        <div className="manage-user-page">
            <header className="manage-user-header">
                <h1>Create New Course</h1>
                <button onClick={() => window.location.href = '/admin/content'} className="back-button">Back to Content Manager</button>
            </header>
            <main className="manage-user-main">
                <div className="card">
                    <h3>Course Details</h3>
                    <div className="form-group">
                        <label>Course Name</label>
                        <input type="text" placeholder="e.g., Advanced Frontend Development" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea placeholder="A brief summary of the course" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                </div>

                <div className="card">
                    <h3>Target Audience</h3>
                    <div className="form-group">
                        <label>Department</label>
                        <select value={targetDepartment} onChange={e => setTargetDepartment(e.target.value)}>
                            {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={targetRole} onChange={e => setTargetRole(e.target.value)} disabled={!availableRoles.length}>
                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="card ai-card">
                    <h3>AI Content Generation (Gemini)</h3>
                    <p>Click the button below to use AI to automatically generate learning modules, materials, and assessments for this course based on the target role.</p>
                    <button onClick={handleAIGenerate} className="action-button-ai">Generate Course Content</button>
                </div>

                <div className="card">
                    <button onClick={handleSaveCourse} className="action-button" style={{width: '100%'}}>Save Course Structure</button>
                </div>
            </main>
        </div>
    );
};

export default CourseEditor;
