import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LearnerDashboard.css';

const LearnerDashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [activeView, setActiveView] = useState('learning');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedSkill, setExpandedSkill] = useState(null);

  const fetchAllData = async () => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
            setLoading(false);
            return;
        }
        setUser(userInfo.user);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        const [dashboardRes, notifRes] = await Promise.all([
            axios.get('http://localhost:5001/api/dashboard', config),
            axios.get('http://localhost:5001/api/dashboard/notifications', config)
        ]);

        setDashboardData(dashboardRes.data);
        setNotifications(notifRes.data);
        
        if (dashboardRes.data.skillProfile && dashboardRes.data.skillProfile.length > 0) {
            setExpandedSkill(dashboardRes.data.skillProfile[0].skillName);
        }
        setLoading(false);
    } catch (err) {
        console.error("Failed to fetch data", err);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleBellClick = async () => {
    setIsNotifDropdownOpen(!isNotifDropdownOpen);
    if (!isNotifDropdownOpen && notifications.some(n => !n.isRead)) {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put('http://localhost:5001/api/dashboard/notifications/mark-read', {}, config);
            fetchAllData();
        } catch (err) {
            console.error("Failed to mark notifications as read", err);
        }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/';
  };
  
  const toggleCourse = (courseName) => {
    setExpandedCourse(expandedCourse === courseName ? null : courseName);
  };

  const toggleSkill = (skillName) => {
    setExpandedSkill(expandedSkill === skillName ? null : skillName);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="dashboard-loading"><h1>Loading Dashboard...</h1></div>;
  if (!dashboardData) return <div className="dashboard-loading"><h1>Could not load dashboard data.</h1></div>;

  return (
    <div className="learner-dashboard">
        <header className="learner-header">
            <h1 className="logo">Learn Axis</h1>
            <div className="header-right">
                <div className="notification-bell" onClick={handleBellClick}>
                    🔔
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    {isNotifDropdownOpen && (
                        <div className="notification-dropdown">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif._id} className={`notification-item ${!notif.isRead ? 'unread' : ''}`}>
                                        <p>{notif.message}</p>
                                        <span className="notification-time">{new Date(notif.createdAt).toLocaleString()}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="notification-item">No new notifications.</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="profile-menu" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                    <div className="profile-summary">
                        <span className="user-name">{user?.username}</span>
                        <span className="user-dept">{user?.department}</span>
                    </div>
                    <div className="profile-avatar"></div>
                    {isProfileDropdownOpen && (
                        <div className="profile-dropdown">
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Emp ID:</strong> {user?.empId}</p>
                            <p><strong>Department:</strong> {user?.department}</p>
                            <p><strong>Role:</strong> {user?.role}</p>
                            <button className="dropdown-button logout" onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
        <main className="learner-main">
            <nav className="dashboard-nav">
                <button onClick={() => setActiveView('learning')} className={activeView === 'learning' ? 'active' : ''}>My Learning</button>
                <button onClick={() => setActiveView('skills')} className={activeView === 'skills' ? 'active' : ''}>My Skills</button>
                <button onClick={() => setActiveView('library')} className={activeView === 'library' ? 'active' : ''}>Resource Library</button>
            </nav>

            <div className="dashboard-content">
                {activeView === 'learning' && (
                    <>
                        <h2>WELCOME {user?.username?.toUpperCase()},</h2>
                        {dashboardData.proficiencyAssessmentStatus === 'pre-assessment-pending' ? (
                            <div className="assessment-prompt-card">
                                <h3>Pre-Assessment for "{dashboardData.currentCourse}"</h3>
                                <p>To personalize your learning path, please complete a short assessment on the first topic: <strong>{dashboardData.preAssessmentModuleTitle}</strong>.</p>
                                <button onClick={() => window.location.href = '/assessment'} className="start-assessment-button">Start Assessment</button>
                            </div>
                        ) : (
                            <>
                                <div className="modules-container">
                                    {dashboardData.assignedTasks && dashboardData.assignedTasks.length > 0 ? (
                                        dashboardData.assignedTasks.map((task, index) => (
                                            <div className="module-card" key={task._id}>
                                                <div className="module-header">
                                                    <h3>WEEK {index + 1}</h3>
                                                    <div className={`status-checkbox ${task.completed ? 'completed' : ''}`}>✓</div>
                                                </div>
                                                <div className="module-body">
                                                    <h4>{task.title}</h4>
                                                </div>
                                                <button className="open-button" onClick={() => window.location.href = `/dashboard/task/${task._id}`}>OPEN →</button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-modules-message">
                                            <p>No learning modules have been assigned to you yet.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="progress-section">
                                    <h3>Overall Progress</h3>
                                    <div className="overall-progress-bar-container">
                                        <div className="overall-progress-bar" style={{ width: `${dashboardData.learningProgress}%` }}></div>
                                    </div>
                                    <span>{dashboardData.learningProgress}%</span>
                                </div>
                            </>
                        )}
                    </>
                )}

                {activeView === 'skills' && (
                     <div className="skill-profile-card">
                        <h2>My Skill Profile</h2>
                        {dashboardData.skillProfile && dashboardData.skillProfile.length > 0 ? (
                            dashboardData.skillProfile.map(profile => {
                                const masteredTopics = profile.topics.filter(topic => topic.proficiency === 'Mastered');
                                const improvementTopics = profile.topics.filter(topic => topic.proficiency === 'Needs Improvement');
                                
                                return (
                                    <div key={profile._id} className="skill-accordion-item">
                                        <div className="skill-summary" onClick={() => toggleSkill(profile.skillName)}>
                                            <h3>{profile.skillName}</h3>
                                            <span>{expandedSkill === profile.skillName ? '▲ Collapse' : '▼ Expand'}</span>
                                        </div>
                                        {expandedSkill === profile.skillName && (
                                            <div className="skill-details">
                                                <h4>Mastered Skills</h4>
                                                {masteredTopics.length > 0 ? (
                                                    <ul className="topic-list">
                                                        {masteredTopics.map(topic => (
                                                            <li key={topic._id} className="topic-item mastered">
                                                                <span className="topic-name">{topic.topicName}</span>
                                                                <span className="topic-proficiency">{topic.proficiency}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (<p>You haven't mastered any specific topics for this skill yet.</p>)}

                                                <h4 style={{marginTop: '2rem'}}>Skills to Improve</h4>
                                                {improvementTopics.length > 0 ? (
                                                    <ul className="topic-list">
                                                        {improvementTopics.map(topic => (
                                                            <li key={topic._id} className="topic-item needs-improvement">
                                                                <span className="topic-name">{topic.topicName}</span>
                                                                <span className="topic-proficiency">{topic.proficiency}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (<p>Great job! You have no topics that need improvement for this skill.</p>)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p>No skill profile data available. Complete an assessment to see your skills breakdown.</p>
                        )}
                    </div>
                )}

                {activeView === 'library' && (
                    <div className="resource-library-container">
                         <h2>My Resource Library</h2>
                         {dashboardData.completedCourses && dashboardData.completedCourses.length > 0 ? (
                            dashboardData.completedCourses.map(course => (
                                <div key={course._id} className="course-library-item">
                                    <div className="course-summary" onClick={() => toggleCourse(course.courseName)}>
                                        <h3>{course.courseName}</h3>
                                        <span>{expandedCourse === course.courseName ? '▲ Collapse' : '▼ Expand'}</span>
                                    </div>
                                    {expandedCourse === course.courseName && (
                                        <div className="course-resources">
                                            {course.tasks.map(task => (
                                                <div key={task._id} className="resource-module">
                                                    <h4>{task.title}</h4>
                                                    {task.video && task.video.youtube_id && (<p><strong>Video:</strong> <a href={`https://www.youtube.com/watch?v=${task.video.youtube_id}`} target="_blank" rel="noopener noreferrer">{task.video.title}</a></p>)}
                                                    {task.articles && task.articles.length > 0 && (
                                                        <>
                                                            <p><strong>Articles:</strong></p>
                                                            <ul>{task.articles.map((article, index) => (<li key={index}><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a></li>))}</ul>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>Your library is empty. Complete a course to save its learning materials here.</p>
                        )}
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default LearnerDashboard;
