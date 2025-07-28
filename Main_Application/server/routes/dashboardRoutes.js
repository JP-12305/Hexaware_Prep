// server/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard
// @desc    Get logged-in user's dashboard data
// @access  Private
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

// @route   PUT /api/dashboard/tasks/:taskId/complete
// @desc    Mark a task as complete and update progress
// @access  Private
router.put('/tasks/:taskId/complete', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const task = user.assignedTasks.id(req.params.taskId);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        task.completed = true;

        const totalTasks = user.assignedTasks.length;
        const completedTasks = user.assignedTasks.filter(t => t.completed).length;
        const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        user.learningProgress = newProgress;

        if (newProgress === 100 && user.currentCourse !== 'None') {
            user.completedCourses.push({ courseName: user.currentCourse });
            user.currentCourse = 'None';
            user.learningProgress = 0;
            user.assignedTasks = [];
        }

        await user.save();
        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;