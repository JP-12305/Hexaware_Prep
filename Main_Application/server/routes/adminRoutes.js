const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Suggestion = require('../models/Suggestion');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/authMiddleware');
const axios = require('axios');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get a single user by ID
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user's details (role, department)
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
  const { role, department } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.role = role || user.role;
    user.department = department || user.department;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        await user.deleteOne();
        res.json({ msg: 'User removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/users/:id/assign-course
// @desc    Assign a course and trigger the pre-assessment flow
// @access  Private/Admin
router.post('/users/:id/assign-course', protect, admin, async (req, res) => {
    const { courseName } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const alreadyCompleted = user.completedCourses.some(course => course.courseName === courseName);
        if (alreadyCompleted) {
            return res.status(400).json({ msg: 'This user has already completed this course.' });
        }

        const course = await Course.findOne({ name: courseName });
        if (!course || course.modules.length === 0) {
            return res.status(404).json({ msg: 'Course or its modules not found' });
        }

        user.currentCourse = course.name;
        user.assignedTasks = [];
        user.learningProgress = 0;
        user.proficiencyAssessmentStatus = 'pre-assessment-pending';
        user.preAssessmentModuleTitle = course.modules[0].title;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error("Error in assign-course:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/users/:id/assign-course
// @desc    Remove the current course from a user
// @access  Private/Admin
router.delete('/users/:id/assign-course', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.currentCourse = 'None';
        user.learningProgress = 0;
        user.assignedTasks = [];
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/users/:userId/tasks/:taskId
// @desc    Delete a task for a user
// @access  Private/Admin
router.delete('/users/:userId/tasks/:taskId', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.assignedTasks.pull({ _id: req.params.taskId });
        
        const totalTasks = user.assignedTasks.length;
        const completedTasks = user.assignedTasks.filter(t => t.completed).length;
        user.learningProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        await user.save();
        res.json({ msg: 'Task removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data for the dashboard
// @access  Private/Admin
router.get('/analytics', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const usersByDepartment = await User.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const avgProgressByDept = await User.aggregate([
            { $group: { _id: '$department', avgProgress: { $avg: '$learningProgress' } } },
            { $sort: { avgProgress: -1 } }
        ]);
        const overallAvgProgress = await User.aggregate([
            { $group: { _id: null, overallProgress: { $avg: '$learningProgress' } } }
        ]);
        res.json({
            totalUsers,
            usersByDepartment,
            avgProgressByDept,
            overallAvgProgress: overallAvgProgress.length > 0 ? overallAvgProgress[0].overallProgress : 0,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/analytics/:userId
// @desc    Get analytics data for a single user
// @access  Private/Admin
router.get('/analytics/:userId', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const totalTasks = user.assignedTasks.length;
        const completedTasks = user.assignedTasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        res.json({
            username: user.username,
            totalTasks,
            completedTasks,
            pendingTasks,
            learningProgress: user.learningProgress,
            assignedTasks: user.assignedTasks,
            skillProfile: user.skillProfile
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users/:userId/assessments
// @desc    Get all completed assessments for a single user
// @access  Private/Admin
router.get('/users/:userId/assessments', protect, admin, async (req, res) => {
    try {
        const assessments = await Assessment.find({ 
            user: req.params.userId, 
            status: 'completed' 
        }).sort({ createdAt: -1 });
        res.json(assessments);
    } catch (err) {
        console.error("Error fetching user assessments:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/reset-assessment
// @desc    Reset a user's proficiency assessment status
// @access  Private/Admin
router.put('/users/:id/reset-assessment', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.proficiencyAssessmentStatus = 'pending';
        user.skillProfile = [];
        user.assignedTasks = [];
        user.learningProgress = 0;
        user.currentCourse = 'None';
        await user.save();
        res.json({ msg: 'User assessment status has been reset.' });
    } catch (err) {
        console.error("Error resetting assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/suggestions
// @desc    Get all pending suggestions
// @access  Private/Admin
router.get('/suggestions', protect, admin, async (req, res) => {
    try {
        const suggestions = await Suggestion.find({ status: 'pending' }).populate('user', 'username');
        res.json(suggestions);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/suggestions/:id/approve
// @desc    Approve a suggestion and assign the remedial module
router.put('/suggestions/:id/approve', protect, admin, async (req, res) => {
    try {
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) return res.status(404).json({ msg: 'Suggestion not found' });

        const user = await User.findById(suggestion.user);
        
        const contentGenUrl = 'http://localhost:5002/generate-module-content';
        const contentResponse = await axios.post(contentGenUrl, { module_title: suggestion.suggestedModuleTitle });
        
        const newRemedialTask = {
            title: suggestion.suggestedModuleTitle,
            ...contentResponse.data,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
        };
        
        const taskIndex = user.assignedTasks.findIndex(t => t.title === suggestion.failedTopic);
        user.assignedTasks.splice(taskIndex + 1, 0, newRemedialTask);
        
        suggestion.status = 'approved';
        await suggestion.save();
        user.markModified('assignedTasks');
        await user.save();
        
        const newNotification = new Notification({
            user: user._id,
            message: `Your admin has assigned a new module to help you with "${suggestion.failedTopic}": "${suggestion.suggestedModuleTitle}".`
        });
        await newNotification.save();

        res.json(suggestion);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/admin/suggestions/:id/dismiss
// @desc    Dismiss an AI suggestion
// @access  Private/Admin
router.put('/suggestions/:id/dismiss', protect, admin, async (req, res) => {
    try {
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ msg: 'Suggestion not found' });
        }
        
        suggestion.status = 'dismissed';
        await suggestion.save();
        
        res.json({ msg: 'Suggestion dismissed successfully.' });
    } catch (err) {
        console.error("Error dismissing suggestion:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users/:userId/report
// @desc    Generate a PDF report for a single user
// @access  Private/Admin
router.get('/users/:userId/report', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const assessments = await Assessment.find({ 
            user: req.params.userId, 
            status: 'completed' 
        }).sort({ createdAt: -1 });

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${user.username}_report.pdf`);
        
        doc.pipe(res);

        doc.fontSize(24).font('Helvetica-Bold').text('Learner Performance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text('User Details');
        doc.fontSize(12).font('Helvetica').text(`Name: ${user.username}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Department: ${user.department}`);
        doc.text(`Role: ${user.role}`);
        doc.moveDown();

        doc.fontSize(16).font('Helvetica-Bold').text('Skill Profile');
        if (user.skillProfile && user.skillProfile.length > 0) {
            user.skillProfile.forEach(profile => {
                doc.fontSize(14).font('Helvetica-Bold').text(profile.skillName);
                profile.topics.forEach(topic => {
                    doc.fontSize(11).font('Helvetica').text(`  • ${topic.topicName}: `)
                       .font(topic.proficiency === 'Mastered' ? 'Helvetica-Bold' : 'Helvetica')
                       .fillColor(topic.proficiency === 'Mastered' ? 'green' : 'red')
                       .text(topic.proficiency, { continued: false, fillColor: 'black' });
                });
            });
        } else {
            doc.fontSize(12).font('Helvetica').text('No skill profile data available.');
        }
        doc.moveDown();

        doc.fontSize(16).font('Helvetica-Bold').text('Assessment History');
        if (assessments && assessments.length > 0) {
            assessments.forEach(assessment => {
                doc.fontSize(12).font('Helvetica-Bold').text(`${assessment.courseName} (${new Date(assessment.createdAt).toLocaleDateString()})`);
                doc.fontSize(11).font('Helvetica').text(`  • Score: ${assessment.score}%`);
            });
        } else {
            doc.fontSize(12).font('Helvetica').text('No completed assessments found.');
        }

        doc.end();

    } catch (err) {
        console.error("Error generating report:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
