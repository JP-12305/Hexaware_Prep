import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import AdminDashboard from './components/AdminDashboard';
import ManageUserPage from './components/ManageUserPage';
import LearnerDashboard from './components/LearnerDashboard';
import TaskDetailPage from './components/TaskDetailPage';
import AnalyticsDashboard from './components/AnalyticsDashboard'; 
import UserAnalyticsPage from './components/UserAnalyticsPage';
import ContentManager from './components/ContentManager';
import CourseEditor from './components/CourseEditor';
import AIGeneratorPage from './components/AIGeneratorPage';
import CourseContentEditor from './components/CourseContentEditor';
import AssessmentPage from './components/AssessmentPage';
import UserAssessmentHistory from './components/UserAssessmentHistory';

const App = () => {
  return (
    <Router>
      <Routes>

        {/*Authentication Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/*Learner */}
        <Route path="/dashboard" element={<LearnerDashboard />} />
        <Route path="/dashboard/task/:taskId" element={<TaskDetailPage />} />

        {/*Assessment */}
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/assessment/module/:moduleId" element={<AssessmentPage />} />

        {/*Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/user/:userId" element={<ManageUserPage />} />
        <Route path="/admin/user/:userId/assessments" element={<UserAssessmentHistory />} />

        {/* 📚 Content */}
        <Route path="/admin/content" element={<ContentManager />} />
        <Route path="/admin/content/new" element={<CourseEditor />} />
        <Route path="/admin/content/ai-generator" element={<AIGeneratorPage />} />
        <Route path="/admin/content/editor/:courseId" element={<CourseContentEditor />} />

        {/* 📊 Analytics */}
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        <Route path="/admin/analytics/:userId" element={<UserAnalyticsPage />} />

      </Routes>
    </Router>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const handleSwitchToSignup = () => {
    navigate('/signup');
  };

  return (
    <AuthLayout>
      <LoginForm onSwitchToSignup={handleSwitchToSignup} />
    </AuthLayout>
  );
};

const SignupPage = () => {
  const navigate = useNavigate();
  const handleSwitchToLogin = () => {
    navigate('/');
  };

  return (
    <AuthLayout>
      <SignupForm onSwitchToLogin={handleSwitchToLogin} />
    </AuthLayout>
  );
};

const AuthLayout = ({ children }) => (
  <div className="app-background">
    <div className="card">
      {children}
    </div>
  </div>
);

export default App;
