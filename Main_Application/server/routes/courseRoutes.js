// server/routes/courseRoutes.js

const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, admin } = require('../middleware/authMiddleware');
const axios = require('axios');

// MODIFIED: This route now generates and creates the course in one go
// @route   POST /api/courses/generate
// @desc    Generate and create a new course using AI
// @access  Private/Admin
router.post('/generate', protect, admin, async (req, res) => {
    const { targetDepartment, targetRole } = req.body;
    try {
        // --- Call the Python AI Agent ---
        const aiAgentUrl = 'http://localhost:5002/generate-course';
        const payload = { target_role: targetRole };
        const agentResponse = await axios.post(aiAgentUrl, payload);
        
        // --- START DEBUG LOGGING ---
        console.log("--- Response from Python AI Agent ---");
        console.log("Status:", agentResponse.status);
        console.log("Data:", JSON.stringify(agentResponse.data, null, 2));
        // --- END DEBUG LOGGING ---

        const { name, description, modules } = agentResponse.data;

        // --- ADDED VALIDATION ---
        if (!modules || !Array.isArray(modules) || modules.length === 0) {
            console.error("ERROR: AI agent did not return a valid 'modules' array.");
            return res.status(500).send('AI agent failed to generate course modules.');
        }
        // --- END VALIDATION ---

        // Create the new course with AI-generated content
        const newCourse = new Course({
            name,
            description,
            modules,
            targetDepartment,
            targetRole,
            createdBy: req.user.id
        });

        const course = await newCourse.save();
        res.status(201).json(course);

    } catch (err) {
        console.error("AI Course Creation Error:", err.response ? err.response.data : err.message);
        res.status(500).send('Failed to create course with AI');
    }
});

// @route   GET /api/courses/:id
// @desc    Get a single course by ID
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all courses (existing route)
router.get('/', protect, admin, async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a course (existing route)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        await course.deleteOne();
        res.json({ msg: 'Course removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/courses/:courseId/modules/:moduleId/generate-content
// @desc    Use AI to generate detailed content for a specific module
// @access  Private/Admin
router.post('/:courseId/modules/:moduleId/generate-content', protect, admin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const module = course.modules.id(req.params.moduleId);
        if (!module) {
            return res.status(404).json({ msg: 'Module not found' });
        }

        // Call the Python AI Agent's new endpoint
        const aiAgentUrl = 'http://localhost:5002/generate-module-content';
        const payload = { module_title: module.title };
        const agentResponse = await axios.post(aiAgentUrl, payload);
        
        const { summary, articles, video } = agentResponse.data;

        // Update the module with the AI-generated content
        module.summary = summary;
        module.articles = articles;
        module.video = video;

        await course.save();
        res.json(module);

    } catch (err) {
        console.error("Module Content Generation Error:", err.response ? err.response.data : err.message);
        res.status(500).send('Failed to generate module content');
    }
});

module.exports = router;
