import React, { useState } from 'react';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from './Icons';

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
      const userCredentials = {
        identifier: formData.identifier,
        password: formData.password
      };

      try {
        const { data } = await axios.post('http://localhost:5001/api/auth/login', userCredentials);
        
        localStorage.setItem('userInfo', JSON.stringify(data));

        // alert('Login successful!');
        
        if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }

      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert('Login failed: ' + (err.response ? err.response.data.msg : 'Invalid Credentials'));
      }
    }
  };

  return (
    <div className="form-container">
      <div className="header">
        <div className="logo-placeholder"></div>
        <h1 className="title">MEMBER LOGIN</h1>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="inputs-wrapper">
          <div>
            <input
              type="text"
              name="identifier"
              placeholder="USERNAME OR EMAIL"
              value={formData.identifier}
              onChange={handleChange}
              className="input-field"
            />
            {errors.identifier && <p className="error-message">{errors.identifier}</p>}
          </div>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="PASSWORD"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
        </div>
        <button type="submit" className="submit-btn">
          LOGIN
        </button>
      </form>
      <div className="switch-form-container">
        <button onClick={onSwitchToSignup} className="switch-form-btn">
          Create a new account? SIGNUP
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
