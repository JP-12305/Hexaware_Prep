const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');

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

// @route   POST /api/dashboard/start-assessment
// @desc    Generate and start the INITIAL proficiency assessment
// @access  Private
router.post('/start-assessment', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const course = await Course.findOne({ name: user.currentCourse });
        if (!course) {
            return res.status(404).json({ msg: 'Current course not found for user' });
        }
        
        const aiAgentUrl = 'http://localhost:5002/generate-proficiency-assessment';
        const payload = { target_role: user.role }; 
        const agentResponse = await axios.post(aiAgentUrl, payload);
        const { questions } = agentResponse.data;

        const newAssessment = new Assessment({
            user: user._id,
            course: course._id,
            courseName: user.currentCourse,
            assessmentType: 'proficiency',
            questions: questions
        });
        const assessment = await newAssessment.save();
        res.json(assessment);
    } catch (err) {
        console.error("Error starting assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/dashboard/tasks/:taskId/start-assessment
// @desc    Generate and start a PER-MODULE assessment
// @access  Private
router.post('/tasks/:taskId/start-assessment', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const task = user.assignedTasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const aiAgentUrl = 'http://localhost:5002/generate-proficiency-assessment';
        const payload = { target_role: task.title }; 
        const agentResponse = await axios.post(aiAgentUrl, payload);
        const { questions } = agentResponse.data;

        const newAssessment = new Assessment({
            user: user._id,
            courseName: user.currentCourse,
            assessmentType: 'module',
            relatedTaskId: req.params.taskId,
            questions: questions
        });
        const assessment = await newAssessment.save();
        res.json(assessment);
    } catch (err) {
        console.error("Error starting module assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/dashboard/submit-assessment/:assessmentId
// @desc    Submit ANY assessment, update skill profile, and take appropriate action
// @access  Private
router.post('/submit-assessment/:assessmentId', protect, async (req, res) => {
    const { answers } = req.body;
    try {
        const assessment = await Assessment.findById(req.params.assessmentId);
        if (!assessment) return res.status(404).json({ msg: 'Assessment not found' });

        const user = await User.findById(req.user.id);
        
        let score = 0;
        let skillProfile = user.skillProfile.find(p => p.skillName === user.role);
        if (!skillProfile) {
            skillProfile = { skillName: user.role, topics: [] };
            user.skillProfile.push(skillProfile);
        }

        assessment.questions.forEach(q => {
            q.userAnswer = answers[q._id] || '';
            const isCorrect = q.userAnswer === q.correctAnswer;
            if (isCorrect) score++;

            let topic = skillProfile.topics.find(t => t.topicName === q.topic);
            if (!topic) {
                topic = { topicName: q.topic };
                skillProfile.topics.push(topic);
            }
            topic.proficiency = isCorrect ? 'Mastered' : 'Needs Improvement';
        });
        const finalScore = Math.round((score / assessment.questions.length) * 100);
        assessment.score = finalScore;
        assessment.status = 'completed';
        await assessment.save();

        if (assessment.assessmentType === 'proficiency') {
            user.proficiencyAssessmentStatus = 'completed';
            const aiAgentUrl = 'http://localhost:5002/generate-full-course-content';
            const proficiencyContext = finalScore < 50 ? "beginner" : (finalScore < 80 ? "intermediate" : "advanced");
            const dynamicRole = `${proficiencyContext} ${user.role}`;
            const agentResponse = await axios.post(aiAgentUrl, { target_role: dynamicRole });
            
            user.assignedTasks = agentResponse.data.modules.map((module, index) => ({
                title: module.title,
                summary: module.summary,
                articles: module.articles,
                video: module.video,
                dueDate: new Date(new Date().setDate(new Date().getDate() + 7 * (index + 1)))
            }));

        } else if (assessment.assessmentType === 'module') {
            const task = user.assignedTasks.id(assessment.relatedTaskId);
            if (task) {
                task.completed = true;
                const totalTasks = user.assignedTasks.length;
                const completedTasks = user.assignedTasks.filter(t => t.completed).length;
                user.learningProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                if (user.learningProgress === 100 && user.currentCourse !== 'None') {
                    user.completedCourses.push({ courseName: user.currentCourse });
                    user.currentCourse = 'None';
                    user.learningProgress = 0;
                    user.assignedTasks = [];
                }
            }
        }
        
        user.markModified('skillProfile');
        await user.save();
        res.json({ score: finalScore });

    } catch (err) {
        console.error("Error submitting assessment:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
