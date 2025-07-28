const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, email, empId, password } = req.body;

  console.log('--- Registration Attempt Received ---');
  console.log('Username:', username);
  console.log('Email:', email);
  console.log('Emp ID:', empId);
  console.log('Password to be hashed:', password);
  

  try {
    let user = await User.findOne({ email });
    if (user) {
      console.log('DEBUG: Registration failed. User with this email already exists.');
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    user = new User({ username, email, empId, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log('DEBUG: Password hashed successfully.');

    await user.save();
    console.log('DEBUG: New user saved to database successfully.');

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error('--- UNEXPECTED SERVER ERROR in /register route ---');
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    
    console.log('--- Login Attempt Received ---');
    console.log('Identifier:', identifier);
    console.log('Password received:', password ? 'Yes' : 'No');


    try {
        let user = await User.findOne({
          $or: [{ email: identifier }, { username: identifier }],
        });
        
        if (!user) {
            console.log('DEBUG: User lookup failed. No user found with that identifier.');
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        console.log('DEBUG: User found in database:', user.username);

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('DEBUG: Password comparison failed. Passwords do not match.');
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        console.log('DEBUG: Password matched successfully.');

        const payload = {
            user: {
                id: user.id,
            },
        };
        
        if (!process.env.JWT_SECRET) {
            console.log('FATAL ERROR: JWT_SECRET is not defined in your .env file.');
            return res.status(500).send('Server configuration error.');
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) {
                    console.error('DEBUG: Error during JWT signing:', err);
                    return res.status(500).send('Error creating authentication token.');
                };
                console.log('DEBUG: JWT created successfully. Sending response to client.');
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        empId: user.empId,
                        role: user.role,
                        department: user.department
                    }
                });
            }
        );

    } catch (err) {
        console.error('--- UNEXPECTED SERVER ERROR in /login route ---');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
