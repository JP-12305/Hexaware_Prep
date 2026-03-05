import React, { useState } from 'react';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from './Icons';

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state for feedback

  // Use the Environment Variable or fallback to localhost for dev
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier) newErrors.identifier = 'Username or Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for a field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt initiated...");

    if (validate()) {
      setLoading(true);
      try {
        console.log(`Connecting to: ${API_URL}/api/auth/login`);
        
        const { data } = await axios.post(`${API_URL}/api/auth/login`, {
          identifier: formData.identifier,
          password: formData.password
        });
        
        console.log("Login successful, redirecting...");
        localStorage.setItem('userInfo', JSON.stringify(data));
        window.location.href = data.user.role === 'admin' ? '/admin' : '/dashboard';

      } catch (err) {
        console.error("Login Error:", err);
        const msg = err.response?.data?.msg || 'Server is waking up or connection failed. Please try again in a few seconds.';
        alert('Login failed: ' + msg);
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Validation failed:", errors);
    }
  };

  return (
    <div className="form-container">
      <div className="header"><h1 className="title">MEMBER LOGIN</h1></div>
      <form onSubmit={handleSubmit}>
        <div className="inputs-wrapper">
          <div className="input-group">
            <input 
              type="text" 
              name="identifier" 
              placeholder="USERNAME OR EMAIL" 
              value={formData.identifier} 
              onChange={handleChange} 
              className={`input-field ${errors.identifier ? 'error-border' : ''}`} 
              disabled={loading}
            />
            {errors.identifier && <p className="error-message">{errors.identifier}</p>}
          </div>

          <div className="input-group">
            <div className="password-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                placeholder="PASSWORD" 
                value={formData.password} 
                onChange={handleChange} 
                className={`input-field ${errors.password ? 'error-border' : ''}`} 
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>
      </form>
      
      <div className="switch-form-container">
        <button onClick={onSwitchToSignup} className="switch-form-btn" disabled={loading}>
          Signup Instead
        </button>
      </div>
    </div>
  );
};

export default LoginForm;