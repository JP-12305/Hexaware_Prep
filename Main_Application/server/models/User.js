// server/models/User.js

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: String,
  dueDate: Date,
  completed: { type: Boolean, default: false },
  testUrl: String,
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  empId: { type: String, required: true },
  password: { type: String, required: true },
  // MODIFIED: Role is now a simple string
  role: { type: String, default: 'Unassigned' },
  department: { type: String, default: 'Unassigned' },
  currentCourse: { type: String, default: 'None' },
  learningProgress: { type: Number, default: 0, min: 0, max: 100 },
  assignedTasks: [TaskSchema],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', UserSchema);
