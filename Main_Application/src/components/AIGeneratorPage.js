// src/AIGeneratorPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageUserPage.css'; // Reuse styles

const AIGeneratorPage = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // State for the new chained dropdowns
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('');
    
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('http://localhost:5001/api/departments', config);
                setDepartments(data);
                if (data.length > 0) {
                    setSelectedDept(data[0].name);
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch departments");
                setLoading(false);
            }
        };
        fetchDepts();
    }, []);

    // CORRECTED LOGIC: These effects now correctly handle updates without resetting the initial state.
    useEffect(() => {
        const dept = departments.find(d => d.name === selectedDept);
        if (dept) {
            const newCategories = dept.roles.map(r => r.category);
            setAvailableCategories(newCategories);
            setSelectedCategory(newCategories[0] || '');
        }
    }, [selectedDept, departments]);

    useEffect(() => {
        const dept = departments.find(d => d.name === selectedDept);
        if (dept) {
            const roleCategory = dept.roles.find(r => r.category === selectedCategory);
            if (roleCategory) {
                const newSkills = roleCategory.skills;
                setAvailableSkills(newSkills);
                setSelectedSkill(newSkills[0] || '');
            }
        }
    }, [selectedCategory, selectedDept, departments]);

    const handleGenerateCourse = async () => {
        if (!selectedDept || !selectedSkill) {
            return alert('Please select a Department and Skill.');
        }
        setGenerating(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const payload = { targetDepartment: selectedDept, targetRole: selectedSkill };
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
                    <p>Choose the department, category, and specific skill for which you want the AI to generate a complete learning course.</p>
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
