// server/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

// @route   POST /api/admin/users/:id/assign-course
// @desc    Assign a course and reset progress
// @access  Private/Admin
router.post('/users/:id/assign-course', protect, admin, async (req, res) => {
    const { courseName } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.currentCourse = courseName;
        user.learningProgress = 0; // Reset progress when a new course is assigned
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/users/:id/schedule-task
// @desc    Schedule a new task for a user
// @access  Private/Admin
router.post('/users/:id/schedule-task', protect, admin, async (req, res) => {
    const { title, dueDate, testUrl } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.assignedTasks.push({ title, dueDate, testUrl });
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
