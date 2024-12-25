import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";

const SignIn = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('userSession');
      const adminSession = localStorage.getItem('adminSession');
      
      if (adminSession) {
        navigate('/admin/flights');
        return true;
      }
      
      if (session) {
        const sessionData = JSON.parse(session);
        const currentTime = new Date().getTime();
        if (currentTime - sessionData.timestamp < 10 * 60 * 1000) {
          navigate('/flights');
          return true;
        } else {
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
    if (name === 'email') setEmailError('');
    if (name === 'password') setPasswordError('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    if (!validateEmail(formData.email)) {
      setEmailError('Invalid email format');
      return;
    }

    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

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

    try {
      // First try admin login
      const adminResponse = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          passwordHash: passwordHash
        })
      });

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        const sessionData = {
          email: formData.email,
          timestamp: new Date().getTime(),
          isAdmin: true
        };
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        onClose();
        navigate('/admin/flights');
        return;
      }

      // If not admin, try regular user login
      const userResponse = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          passwordHash: passwordHash
        })
      });

      if (userResponse.ok) {
        const sessionData = {
          email: formData.email,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        onClose();
        navigate('/flights');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setEmailError('Invalid email or password');
    }
  };

  return (
    <div className="SignIn">
      <div className="signin-overlay">
        <div className="signin-container">
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
          <form onSubmit={handleSubmit} className="signin-form">
            <h2 className="signin-title">Sign In</h2>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
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