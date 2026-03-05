import React, { useState } from 'react';
import axios from 'axios';

// Inline Icon Components to ensure the file is self-contained
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- SAFE API URL RESOLUTION ---
  // Safely check if 'process' is defined to avoid ReferenceErrors in browser/preview environments
  const getApiUrl = () => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
    } catch (e) {
      // process.env access might throw in some strict environments
    }
    return 'http://localhost:5001';
  };

  const rawApiUrl = getApiUrl();
  const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const targetUrl = `${API_URL}/api/auth/login`;
      console.log("Attempting login at:", targetUrl);

      const { data } = await axios.post(targetUrl, {
        identifier: formData.identifier,
        password: formData.password
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      if (data.user && data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }

    } catch (err) {
      console.error("Axios Detailed Error:", err.response || err);
      const msg = err.response?.data?.msg || 'Connection failed. Ensure the backend is awake.';
      alert('Login failed: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '400px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div className="header" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 className="title" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>MEMBER LOGIN</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="inputs-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>IDENTIFIER</label>
            <input 
              type="text" 
              name="identifier" 
              placeholder="USERNAME OR EMAIL" 
              className="input-field"
              style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
              required 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>PASSWORD</label>
            <div className="password-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                placeholder="PASSWORD" 
                className="input-field"
                style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', fontSize: '14px' }}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="password-toggle-btn"
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#999' }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </div>
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
          style={{ 
            marginTop: '25px', 
            width: '100%', 
            padding: '12px', 
            background: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>
      </form>
      {onSwitchToSignup && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={onSwitchToSignup} 
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
          >
            Don't have an account? Sign up
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;