import React, { useState, useEffect } from 'react';
// Import AOS =====>
    import Aos from "aos"
import 'aos/dist/aos.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNo: '',
    email: '',
    password: '',
    address: '',
    postCode: '',
    city: '',
    state: '',
    country: 'Malaysia',
    identityNo: ''
  });

  const [states, setStates] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [identityNoError, setIdentityNoError] = useState('');

  // Simple password hashing 
  const simpleHashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  useEffect(() => {
    // Fetch states from API
    const fetchStates = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/states');
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'state') {
      // Filter state suggestions
      const suggestions = states
        .filter(state => 
          state.state.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setStateSuggestions(suggestions);
    }

    if (name === 'identityNo') {
      // Only allow numbers and limit to 12 characters
      const numericValue = value.replace(/\D/g, '').slice(0, 12);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return {
      valid: hasUppercase && hasLowercase && hasSpecialChar && isLongEnough,
      message: !hasUppercase ? 'Need at least one uppercase letter, one lowercase letter, one special character and must be at least 8 characters' :
               !hasLowercase ? 'Need at least one uppercase letter, one lowercase letter, one special character and must be at least 8 characters' :
               !hasSpecialChar ? 'Need at least one uppercase letter, one lowercase letter, one special character and must be at least 8 characters' :
               !isLongEnough ? 'Need at least one uppercase letter, one lowercase letter, one special character and must be at least 8 characters' : ''
    };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleStateSelect = (selectedState) => {
    setFormData(prev => ({ ...prev, state: selectedState }));
    setStateSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous errors
    setPasswordError('');
    setEmailError('');
    setIdentityNoError('');

    // Validate email
    if (!validateEmail(formData.email)) {
      setEmailError('Invalid email format');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      return;
    }

    // Validate Identity No
    if (formData.identityNo.length !== 12) {
      setIdentityNoError('Identity number must be 12 digits');
      return;
    }

    try {
      // Simple password hashing
      const passwordHash = simpleHashPassword(formData.password);

      // Combine address fields
      const fullAddress = `${formData.address}, ${formData.postCode}, ${formData.city}, ${formData.state}, ${formData.country}`;

      // Format Identity No
      const formattedIdentityNo = 
        `${formData.identityNo.slice(0,6)}-${formData.identityNo.slice(6,8)}-${formData.identityNo.slice(8)}`;

      // Prepare payload
      const payload = {
        name: formData.fullName,
        email: formData.email,
        passwordHash: passwordHash,
        phone: formData.phoneNo,
        address: fullAddress,
        identityNo: formattedIdentityNo
      };

      // Submit to API
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // Redirect or show success message
      window.location.href = '/flights';

    } catch (error) {
      console.error('Registration error:', error);
      // Handle registration error (show message to user)
    }
  };

  return (
    <div className="register">
        <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2 className="register-title">User Registration</h2>

        <div className="form-row">
            <div className="form-group">
            <label>Full Name</label>
            <input 
                type="text" 
                name="fullName" 
                value={formData.fullName}
                onChange={handleChange}
                required 
            />
            </div>

            <div className="form-group">
            <label>Phone Number</label>
            <input 
                type="tel" 
                name="phoneNo" 
                value={formData.phoneNo}
                onChange={handleChange}
                required 
            />
            </div>
        </div>
        
        <div className="form-row">
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
        </div>

        <div className="form-group">
          <label>Address</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address}
            onChange={handleChange}
            required 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Post Code</label>
            <input 
              type="text" 
              name="postCode" 
              value={formData.postCode}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input 
              type="text" 
              name="city" 
              value={formData.city}
              onChange={handleChange}
              required 
            />
          </div>
        </div>

        <div className="form-row">
            <div className="form-group state-input">
            <label>State</label>
            <input 
                type="text" 
                name="state" 
                value={formData.state}
                onChange={handleChange}
                required 
            />
            {stateSuggestions.length > 0 && (
                <ul className="suggestions-list">
                {stateSuggestions.map((suggestion, index) => (
                    <li 
                    key={index} 
                    onClick={() => handleStateSelect(suggestion.state)}
                    >
                    {suggestion.state}
                    </li>
                ))}
                </ul>
            )}
            </div>

            <div className="form-group">
            <label>Identity Number (12 digits)</label>
            <input 
                type="text" 
                name="identityNo" 
                value={formData.identityNo}
                onChange={handleChange}
                required 
                className={identityNoError ? 'error' : ''}
            />
            {identityNoError && <p className="error-message">{identityNoError}</p>}
            </div>
        </div>
        

        <button 
          type="submit" 
          className="submit-button"
        >
          Register
        </button>
      </form>
    </div>
    </div>
  );
};

export default RegisterPage;