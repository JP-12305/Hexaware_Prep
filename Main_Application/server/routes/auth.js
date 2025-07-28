// server/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // We will create this model next

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, email, empId, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    // Create a new user instance
    user = new User({
      username,
      email,
      empId,
      password,
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save the user to the database
    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    // MODIFIED: Changed 'email' to 'identifier' to accept username or email
    const { identifier, password } = req.body;

    try {
        // MODIFIED: Find user by either email or username
        let user = await User.findOne({
          $or: [{ email: identifier }, { username: identifier }],
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // If credentials are correct, create and return a JSON Web Token (JWT)
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: 3600 },
          (err, token) => {
              if (err) throw err;
              // MODIFIED: Return token AND user role
              res.json({ token, role: user.role });
          }
      );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;