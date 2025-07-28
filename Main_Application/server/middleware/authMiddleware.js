// server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  console.log(`--- "protect" middleware triggered for URL: ${req.originalUrl} ---`);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('DEBUG: Token found in header.');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('DEBUG: Token verified. Decoded user ID:', decoded.user.id);

      console.log('DEBUG: Attempting to find user in DB...');
      req.user = await User.findById(decoded.user.id).select('-password');
      
      if (!req.user) {
          console.log('DEBUG: User not found in DB for this ID.');
          return res.status(401).json({ msg: 'Not authorized, user not found' });
      }
      
      console.log('DEBUG: User found successfully:', req.user.username);
      next();
    } catch (error) {
      console.error('ERROR in "protect" middleware:', error.message);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log('DEBUG: No token found in header.');
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  console.log('--- "admin" middleware triggered ---');
  if (req.user && req.user.role === 'admin') {
    console.log('DEBUG: User is an admin. Granting access.');
    next();
  } else {
    console.log(`DEBUG: User is NOT an admin (Role: ${req.user ? req.user.role : 'N/A'}). Denying access.`);
    res.status(401).json({ msg: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
