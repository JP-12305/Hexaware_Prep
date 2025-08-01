// server/models/User.js

const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
    topicName: String,
    proficiency: {
        type: String,
        enum: ['Untested', 'Needs Improvement', 'Mastered'],
        default: 'Untested'
    }
});

const SkillProfileSchema = new mongoose.Schema({
    skillName: String, // e.g., "React Developer"
    topics: [TopicSchema]
});

const TaskSchema = new mongoose.Schema({
    title: String,
    summary: { type: String, default: '' },
    articles: [{
        title: String,
        url: String
    }],
    video: {
        title: String,
        youtube_id: String
    },
    dueDate: Date,
    completed: { type: Boolean, default: false },
    testUrl: String,
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    empId: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Unassigned' },
    department: { type: String, default: 'Unassigned' },
    currentCourse: { type: String, default: 'None' },
    learningProgress: { type: Number, default: 0, min: 0, max: 100 },
    assignedTasks: [TaskSchema],
    // This is the critical field for the assessment flow
    proficiencyAssessmentStatus: {
        type: String,
        enum: ['pending', 'completed','pre-assessment-pending'],
        default: 'completed' 
    },
    preAssessmentModuleTitle: {
    type: String,
    default: ''
    },
    skillProfile: [SkillProfileSchema],
    completedCourses: [{
        courseName: String,
        completedDate: { type: Date, default: Date.now }
    }],
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', UserSchema);
