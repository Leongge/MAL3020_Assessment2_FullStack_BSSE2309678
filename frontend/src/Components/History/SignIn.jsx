import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";

const SignIn = ({ onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Check existing session on component mount
  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('userSession');
      if (session) {
        const sessionData = JSON.parse(session);
        const currentTime = new Date().getTime();
        
        // Check if session is still valid (within 10 minutes)
        if (currentTime - sessionData.timestamp < 10 * 60 * 1000) {
          navigate('/history');
          return true;
        } else {
          // Clear expired session
          localStorage.removeItem('userSession');
        }
      }
      return false;
    };

    checkSession();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear previous errors when user starts typing
    if (name === 'email') setEmailError('');
    if (name === 'password') setPasswordError('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!validateEmail(formData.email)) {
      setEmailError('Invalid email format');
      return;
    }

    // Validate password (basic length check)
    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      // Simple password hashing
      const simpleHashPassword = (password) => {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
          const char = password.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return hash.toString();
      };

      const passwordHash = simpleHashPassword(formData.password);

      // Submit to API
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          passwordHash: passwordHash
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Create a session with timestamp
      const sessionData = {
        email: formData.email,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('userSession', JSON.stringify(sessionData));

      // Handle successful login
      console.log('Login successful');
      
      // Close the popup and trigger login success callback
      onClose();
      
      // If onLoginSuccess prop is provided, call it
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // Default behavior if no callback
        navigate('/history');
      }
    } catch (error) {
      console.error('Login error:', error);
      // You might want to set a general error message here
    }
  };

  return (
    <div className="SignIn">
      <div className="signin-overlay">
        <div className="signin-container">
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
          <form onSubmit={handleSubmit} className="signin-form" data-testid="signin-form">
            <h2 className="signin-title">Sign In</h2>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                data-testid="email-input"
                value={formData.email}
                onChange={handleChange}
                required 
                className={emailError ? 'error' : ''}
              />
              {emailError && <p className="error-message">{emailError}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                data-testid="password-input"
                value={formData.password}
                onChange={handleChange}
                required 
                className={passwordError ? 'error' : ''}
              />
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>

            <button 
              type="submit" 
              className="submit-button"
              data-testid="signin-button"
            >
              Sign In
            </button>

            <div className="signup-prompt">
              <p>
                Don't have an account? {' '}
                <Link 
                  to="/signup" 
                  className="register-link"
                  onClick={onClose}>
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;