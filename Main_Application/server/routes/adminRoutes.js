// server/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const { protect, admin } = require('../middleware/authMiddleware');

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

        const course = await Course.findOne({ name: courseName });
        if (!course || course.modules.length === 0) {
            return res.status(404).json({ msg: 'Course or its modules not found' });
        }

        user.currentCourse = course.name;
        user.assignedTasks = []; // Clear tasks, they will be generated after the assessment
        user.learningProgress = 0;
        
        // --- NEW LOGIC ---
        // Set the status and store the title of the first module for the pre-assessment
        user.proficiencyAssessmentStatus = 'pre-assessment-pending';
        user.preAssessmentModuleTitle = course.modules[0].title;
        // --- END NEW LOGIC ---

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
        user.assignedTasks = []; // Also clear the tasks
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/users/:id/schedule-task
// @desc    Schedule an individual task for a user
// @access  Private/Admin
router.post('/users/:id/schedule-task', protect, admin, async (req, res) => {
    const { title, dueDate } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.assignedTasks.push({ title, dueDate });
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
        
        // Recalculate progress after removing a task
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
            assignedTasks: user.assignedTasks
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
    console.log(`--- Fetching assessments for User ID: ${req.params.userId} ---`);
    try {
        const assessments = await Assessment.find({ 
            user: req.params.userId, 
            status: 'completed' 
        }).sort({ createdAt: -1 });

        console.log(`DEBUG: Found ${assessments.length} completed assessments.`);
        res.json(assessments);
    } catch (err) {
        console.error("--- UNEXPECTED ERROR in /assessments route ---");
        console.error(err); // Log the full error object
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

        // Reset the user's status and clear their skill profile
        user.proficiencyAssessmentStatus = 'pending';
        user.skillProfile = [];
        user.assignedTasks = []; // Also clear tasks to restart the learning path
        user.learningProgress = 0;

        await user.save();
        res.json({ msg: 'User assessment status has been reset.' });
    } catch (err) {
        console.error("Error resetting assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
