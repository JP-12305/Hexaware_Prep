// server/models/Assessment.js

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    questionText: String,
    options: [String],
    correctAnswer: String,
    userAnswer: { type: String, default: '' },
    topic: { type: String, required: true }
});

const AssessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
     assessmentType: {
        type: String,
        enum: ['proficiency', 'module'],
        required: true
    },
    relatedTaskId: { 
        type: String 
    },
    questions: [QuestionSchema],
    score: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('assessment', AssessmentSchema);
