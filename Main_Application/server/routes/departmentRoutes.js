const express = require('express');
const router = express.Router();
const Department = require('../models/Departments');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/departments
// @desc    Get all departments and their roles
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
