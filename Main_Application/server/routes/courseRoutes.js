const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, admin } = require('../middleware/authMiddleware');
const axios = require('axios');

// @route   POST /api/courses/generate
// @desc    Bypass AI generation for manual mode in production
router.post('/generate', protect, admin, async (req, res) => {
    const { targetDepartment, targetRole } = req.body;
    try {
        // --- DEPLOYMENT BYPASS ---
        // We do not call localhost:5002 here as it will fail on Render
        // We return a message to the admin to use the manual entry feature
        res.status(200).json({ 
            msg: "AI Service is currently in Local Mode. Please add course structure manually via the Dashboard.",
            manualMode: true 
        });

    } catch (err) {
        console.error("AI Bypass Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/courses
router.get('/', protect, admin, async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/courses/:courseId/modules/:moduleId/generate-content
// @desc    Bypass AI for module content curation
router.post('/:courseId/modules/:moduleId/generate-content', protect, admin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        const module = course.modules.id(req.params.moduleId);
        
        // Static content fallback
        module.summary = "Manual entry required. AI content curation is currently disabled for the web demo.";
        module.articles = [{ title: "General Reference", url: "https://google.com" }];
        
        await course.save();
        res.json(module);

    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/courses/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        await course.deleteOne();
        res.json({ msg: 'Course removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;