// server/models/Course.js

const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
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
    content: String, // AI-generated content will go here
    assessment: {
        type: String,
        ref: 'Assessment' // We can create this model later
    }
});

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    targetDepartment: {
        type: String,
        required: true,
    },
    targetRole: {
        type: String,
        required: true,
    },
    modules: [ModuleSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, { timestamps: true });

module.exports = mongoose.model('course', CourseSchema);
