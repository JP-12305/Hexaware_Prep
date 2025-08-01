import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import axios from 'axios';
import './LearnerDashboard.css';

const AssessmentPage = () => {
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // State for the review screen
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    // --- THIS IS THE CORRECT FIX for React Strict Mode ---
    // We use a ref to track if the effect has already run.
    // Unlike state, a ref's value persists across re-renders without causing them.
    const effectRan = useRef(false);

    useEffect(() => {
        // In Strict Mode, React runs this effect twice. This check ensures our code only runs once.
        if (effectRan.current === true) {
            return;
        }

        const startAssessment = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                
                const pathParts = window.location.pathname.split('/');
                let apiUrl;
                
                if (pathParts.includes('module')) {
                    const taskId = pathParts[pathParts.length - 1];
                    apiUrl = `http://localhost:5001/api/dashboard/tasks/${taskId}/start-assessment`;
                } else {
                    apiUrl = 'http://localhost:5001/api/dashboard/start-assessment';
                }

                const { data } = await axios.post(apiUrl, {}, config);
                setAssessment(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to start assessment. Please try again later.');
                setLoading(false);
            }
        };

        startAssessment();

        // The cleanup function of the effect is the perfect place to set our flag.
        // It runs when the component unmounts.
        return () => {
            effectRan.current = true;
        };
    }, []); // The empty dependency array is correct and necessary.
    // --- END OF FIX ---

    const handleAnswerChange = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.post(`http://localhost:5001/api/dashboard/submit-assessment/${assessment._id}`, { answers }, config);
            
            setFinalScore(data.score);
            setIsReviewMode(true);

        } catch (err) {
            alert('Failed to submit assessment.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="dashboard-loading"><h1>Generating Your Assessment...</h1></div>;
    if (error) return <div className="dashboard-loading"><h1 style={{color: 'red'}}>{error}</h1></div>;

    return (
        <div className="learner-dashboard">
            <header className="learner-header">
                <h1 className="logo">Assessment: {assessment.courseName}</h1>
            </header>
            <main className="learner-main">
                <div className="assessment-container">
                    {isReviewMode ? (
                        <div>
                            <div className="results-summary">
                                <h2>Assessment Complete!</h2>
                                <p>Your Score: <strong>{finalScore}%</strong></p>
                            </div>
                            {assessment.questions.map((q, index) => (
                                <div key={q._id} className="question-card">
                                    <h4>Question {index + 1}</h4>
                                    <p>{q.questionText}</p>
                                    <div className="options-container">
                                        {q.options.map((option, i) => {
                                            let reviewClass = 'option-review';
                                            const isCorrectAnswer = option === q.correctAnswer;
                                            const isUserAnswer = option === answers[q._id];

                                            if (isCorrectAnswer) {
                                                reviewClass += ' correct';
                                            } else if (isUserAnswer) {
                                                reviewClass += ' incorrect';
                                            }

                                            return (
                                                <div key={i} className={reviewClass}>
                                                    {option}
                                                    {isCorrectAnswer && <span> ✓ Correct Answer</span>}
                                                    {isUserAnswer && !isCorrectAnswer && <span> ✗ Your Answer</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => window.location.href = '/dashboard'} className="start-assessment-button">
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div>
                            {assessment.questions.map((q, index) => (
                                <div key={q._id} className="question-card">
                                    <h4>Question {index + 1} of {assessment.questions.length}</h4>
                                    <p>{q.questionText}</p>
                                    <div className="options-container">
                                        {q.options.map((option, i) => (
                                            <label key={i} className="option-label">
                                                <input
                                                    type="radio"
                                                    name={q._id}
                                                    value={option}
                                                    onChange={() => handleAnswerChange(q._id, option)}
                                                />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleSubmit} className="start-assessment-button" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Answers'}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AssessmentPage;
