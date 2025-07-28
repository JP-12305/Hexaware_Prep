// src/AIGeneratorPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageUserPage.css'; // Reuse styles

const AIGeneratorPage = () => {
    const [departments, setDepartments] = useState([]);
    const [targetDepartment, setTargetDepartment] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

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

    const handleGenerateCourse = async () => {
        if (!targetDepartment || !targetRole) {
            return alert('Please select a Department and Role.');
        }
        setGenerating(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const payload = { targetDepartment, targetRole };
            await axios.post('http://localhost:5001/api/courses/generate', payload, config);
            alert('AI has successfully generated and saved the new course!');
            window.location.href = '/admin/content';
        } catch (err) {
            alert('Failed to generate course with AI.');
        } finally {
            setGenerating(false);
        }
    };
    
    if (loading) return <div className="dashboard-loading"><h1>Loading...</h1></div>;

    return (
        <div className="manage-user-page">
            <header className="manage-user-header">
                <h1>AI Course Generator</h1>
                <button onClick={() => window.location.href = '/admin/content'} className="back-button">Back to Content Manager</button>
            </header>
            <main className="manage-user-main" style={{gridTemplateColumns: '1fr'}}>
                <div className="card">
                    <h3>Select Target Audience</h3>
                    <p>Choose the department and role for which you want the AI to generate a complete learning course.</p>
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
                    <h3>Generate Content with Gemini</h3>
                    <p>The AI will create a professional course name, a brief description, and 3-5 learning modules based on your selection.</p>
                    <button onClick={handleGenerateCourse} className="action-button-ai" disabled={generating}>
                        {generating ? 'Generating, please wait...' : 'Generate Course'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AIGeneratorPage;