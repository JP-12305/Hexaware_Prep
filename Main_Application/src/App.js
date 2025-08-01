// src/App.js

import React from 'react';
import './App.css';
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
// import SkillProfilePage from './components/SkillProfilePage'; 


const App = () => {
  const path = window.location.pathname;

    if (path === '/assessment') {
    return <AssessmentPage />;
    }
    if (path.startsWith('/admin/analytics/')) {
      return <UserAnalyticsPage />;
    }
    if (path === '/admin/content') {
        return <ContentManager />;
    }
    if (path === '/admin/content/ai-generator') {
      return <AIGeneratorPage />;
    }
    if (path === '/admin/content/new') {
        return <CourseEditor />;
    }

    if (path === '/admin/analytics') {
        return <AnalyticsDashboard />;
    }

    if (path.startsWith('/admin/user/') && path.endsWith('/assessments')) {
    return <UserAssessmentHistory />;
    }

    if (path.startsWith('/admin/user/')) {
      return <ManageUserPage />;
    }

    if (path.startsWith('/admin/content/editor/')) {
    return <CourseContentEditor />;
    }

    if (path === '/admin') {
      return <AdminDashboard />;
    }
    
    if (path.startsWith('/dashboard/task/')) {
        return <TaskDetailPage />;
    }

    if (path === '/dashboard') {
        return <LearnerDashboard />;
    }

    // if (path.startsWith('/admin/user/') && path.endsWith('/skill-profile')) {
    //   return <SkillProfilePage />;
    // }

    if (path.startsWith('/admin/analytics/')) {
    return <UserAnalyticsPage />;
    }

    if (path.startsWith('/assessment/module/')) {
      return <AssessmentPage />;
    }

    if (path === '/assessment') {
        return <AssessmentPage />;
    }

  const isLoginView = !new URLSearchParams(window.location.search).has('signup');
  const switchToSignup = () => window.location.href = '/?signup=true';
  const switchToLogin = () => window.location.href = '/';

  return (
    <div className="app-background">
      <div className="card">
        {isLoginView ? (
          <LoginForm onSwitchToSignup={switchToSignup} />
        ) : (
          <SignupForm onSwitchToLogin={switchToLogin} />
        )}
      </div>
    </div>
  );
};

export default App;