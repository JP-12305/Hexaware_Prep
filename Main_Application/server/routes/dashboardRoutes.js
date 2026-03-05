const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Suggestion = require('../models/Suggestion');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');

// @route   GET /api/dashboard
// @desc    Get logged-in user's dashboard data
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dashboard/start-assessment
// @desc    Generate and start assessment (Modified for Deployment)
router.post('/start-assessment', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const course = await Course.findOne({ name: user.currentCourse });
        
        // --- DEPLOYMENT BYPASS ---
        // Instead of calling local AI, we provide a standard technical quiz
        const questions = [
            {
                questionText: "What is the primary purpose of this role's foundational framework?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: "Option A",
                topic: "Fundamentals"
            },
            {
                questionText: "Which tool is most commonly used for version control in professional environments?",
                options: ["Git", "Subversion", "Mercurial", "Zip files"],
                correctAnswer: "Git",
                topic: "Workflow"
            }
        ];

        const newAssessment = new Assessment({
            user: user._id,
            courseName: user.currentCourse || "General Assessment",
            assessmentType: 'proficiency',
            questions: questions
        });
        const assessment = await newAssessment.save();
        res.json(assessment);
    } catch (err) {
        console.error("Error starting assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/dashboard/submit-assessment/:assessmentId
// @desc    Submit assessment and update progress (Modified for Deployment)
router.post('/submit-assessment/:assessmentId', protect, async (req, res) => {
    const { answers } = req.body;
    try {
        const assessment = await Assessment.findById(req.params.assessmentId);
        if (!assessment) return res.status(404).json({ msg: 'Assessment not found' });

        const user = await User.findById(req.user.id);
        
        let score = 0;
        assessment.questions.forEach(q => {
            q.userAnswer = answers[q._id] || '';
            if (q.userAnswer === q.correctAnswer) score++;
        });
        const finalScore = Math.round((score / assessment.questions.length) * 100);
        assessment.score = finalScore;
        assessment.status = 'completed';
        await assessment.save();

        if (assessment.assessmentType === 'proficiency') {
            user.proficiencyAssessmentStatus = 'completed';
            
            // --- DEPLOYMENT BYPASS: Static Path Generation ---
            // Instead of calling AI Agent for a dynamic course, we assign a standard path
            user.assignedTasks = [
                {
                    title: "Module 1: Professional Foundations",
                    summary: "An introduction to core concepts and industry best practices.",
                    articles: [{ title: "Getting Started Guide", url: "https://example.com" }],
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
                },
                {
                    title: "Module 2: Technical Deep Dive",
                    summary: "Exploring advanced topics and implementation strategies.",
                    articles: [{ title: "Documentation Reference", url: "https://example.com" }],
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 14))
                }
            ];
        } else if (assessment.assessmentType === 'module') {
            const task = user.assignedTasks.id(assessment.relatedTaskId);
            if (task) {
                task.completed = true;
                const totalTasks = user.assignedTasks.length;
                const completedTasks = user.assignedTasks.filter(t => t.completed).length;
                user.learningProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            }
        }
        
        user.markModified('assignedTasks');
        await user.save();
        res.json({ score: finalScore });

    } catch (err) {
        console.error("Error submitting assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/dashboard/notifications
router.get('/notifications', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;