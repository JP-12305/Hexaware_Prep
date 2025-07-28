// src/App.js

import React from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import AdminDashboard from './components/AdminDashboard';

// A simple router component
const App = () => {
  const path = window.location.pathname;

  if (path === '/admin') {
    return <AdminDashboard />;
  }
  
  // For now, we'll need a placeholder for the learner dashboard
  if (path === '/dashboard') {
      return (
          <div className="app-background">
              <div className="card">
                  <h1 className="title">Learner Dashboard</h1>
                  <p>Welcome, Learner! Your content is coming soon.</p>
              </div>
          </div>
      );
  }

  // Default to login/signup page. We can use a query param to switch.
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
