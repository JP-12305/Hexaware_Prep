// server/models/Department.js

const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  }
});

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  roles: [RoleSchema],
});

module.exports = mongoose.model('department', DepartmentSchema);
