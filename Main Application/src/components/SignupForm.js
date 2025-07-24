import React, { useState } from 'react';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from './Icons'; // Import icons

const SignupForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    empId: '',
    password: '',
    reenterPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!formData.empId) newErrors.empId = 'Employee ID is required';
    if (!formData.password) {
        newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.reenterPassword) {
      newErrors.reenterPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => { // Make the function async
    e.preventDefault();
    if (validate()) {
      const newUser = {
        username: formData.username,
        email: formData.email,
        empId: formData.empId,
        password: formData.password
      };

      try {
        // Send a POST request to the backend registration endpoint
        const res = await axios.post('http://localhost:5001/api/auth/register', newUser);
        console.log(res.data);
        alert('Signup successful!');
        onSwitchToLogin(); // Switch to login form on success
      } catch (err) {
        console.error(err.response.data);
        alert('Error during signup: ' + err.response.data.msg);
      }
    } else {
      console.log('Signup validation failed');
    }
  };


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="form-container">
      <div className="header">
        <div className="logo-placeholder"></div>
        <h1 className="title">CREATE ACCOUNT</h1>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="inputs-wrapper">
          <input
            type="text"
            name="username"
            placeholder="USERNAME"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
          />
          {errors.username && <p className="error-message">{errors.username}</p>}
          
          <input
            type="email"
            name="email"
            placeholder="EMAIL"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}

          <input
            type="text"
            name="empId"
            placeholder="EMP ID"
            value={formData.empId}
            onChange={handleChange}
            className="input-field"
          />
          {errors.empId && <p className="error-message">{errors.empId}</p>}

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
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}

          <div className="password-wrapper">
            <input
              type={showReenterPassword ? 'text' : 'password'}
              name="reenterPassword"
              placeholder="RE-ENTER PASSWORD"
              value={formData.reenterPassword}
              onChange={handleChange}
              className="input-field"
            />
             <button type="button" onClick={() => setShowReenterPassword(!showReenterPassword)} className="password-toggle-btn">
              {showReenterPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.reenterPassword && <p className="error-message">{errors.reenterPassword}</p>}
        </div>
        <button type="submit" className="submit-btn">
          SIGNUP
        </button>
      </form>
      <div className="switch-form-container">
        <button onClick={onSwitchToLogin} className="switch-form-btn">
          Already have an account? LOGIN
        </button>
      </div>
    </div>
  );
};

export default SignupForm;
