import React, { useState } from 'react';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from './Icons';

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        // CHANGED: Use API_URL variable
        const { data } = await axios.post(`${API_URL}/api/auth/login`, {
          identifier: formData.identifier,
          password: formData.password
        });
        
        localStorage.setItem('userInfo', JSON.stringify(data));
        window.location.href = data.user.role === 'admin' ? '/admin' : '/dashboard';

      } catch (err) {
        alert('Login failed: ' + (err.response?.data?.msg || 'Check your internet connection'));
      }
    }
  };

  return (
    <div className="form-container">
      <div className="header"><h1 className="title">MEMBER LOGIN</h1></div>
      <form onSubmit={handleSubmit}>
        <div className="inputs-wrapper">
          <input type="text" name="identifier" placeholder="USERNAME OR EMAIL" value={formData.identifier} onChange={handleChange} className="input-field" />
          <div className="password-wrapper">
            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="PASSWORD" value={formData.password} onChange={handleChange} className="input-field" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        <button type="submit" className="submit-btn">LOGIN</button>
      </form>
      <div className="switch-form-container">
        <button onClick={onSwitchToSignup} className="switch-form-btn">Signup Instead</button>
      </div>
    </div>
  );
};

export default LoginForm;