import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SignIn from './SignIn';

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignIn, setShowSignIn] = useState(false);

  // Flight details passed from previous page
  const { 
    departureFlight, 
    returnFlight, 
    isReturnTrip 
  } = location.state || {};

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status on component mount
    const session = localStorage.getItem('userSession');
    if (session) {
      const sessionData = JSON.parse(session);
      const currentTime = new Date().getTime();
      
      // Check if session is still valid (within 10 minutes)
      if (currentTime - sessionData.timestamp < 10 * 60 * 1000) {
        setIsLoggedIn(true);
      } else {
        // Clear expired session
        localStorage.removeItem('userSession');
        setShowSignIn(true);
      }
    } else {
      setShowSignIn(true);
    }
  }, []);

  // Passenger details form state
  const [passengerForm, setPassengerForm] = useState({
    title: '',
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    nationality: ''
  });

  // Add-ons state
  const [selectedAddons, setSelectedAddons] = useState({
    departureTripAddons: [],
    returnTripAddons: []
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassengerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date of birth change
  const handleDateOfBirthChange = (date) => {
    setPassengerForm(prev => ({
      ...prev,
      dateOfBirth: date
    }));
  };

  // Handle addon selection
  const handleAddonSelection = (flight, addon) => {
    setSelectedAddons(prev => {
      const isReturnTrip = flight === departureFlight ? 'departureTripAddons' : 'returnTripAddons';
      const currentAddons = prev[isReturnTrip];
      
      // Toggle addon selection
      const updatedAddons = currentAddons.includes(addon)
        ? currentAddons.filter(a => a !== addon)
        : [...currentAddons, addon];

      return {
        ...prev,
        [isReturnTrip]: updatedAddons
      };
    });
  };

  // Handle booking submission
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    // Validate form
    if (!passengerForm.title || !passengerForm.firstName || !passengerForm.lastName || 
        !passengerForm.dateOfBirth || !passengerForm.nationality) {
      alert('Please fill in all passenger details');
      return;
    }

    // Prepare booking data
    const bookingData = {
      passengerDetails: passengerForm,
      flights: {
        departureFlight,
        returnFlight
      },
      addons: selectedAddons
    };

    // TODO: Send booking data to backend
    console.log('Booking Submitted:', bookingData);
    // Redirect to confirmation page or show success message
  };

  // If not logged in, show sign-in popup
  if (showSignIn) {
    return <SignIn onClose={() => {
      const session = localStorage.getItem('userSession');
      if (session) {
        setShowSignIn(false);
        setIsLoggedIn(true);
      } else {
        navigate('/flights');
      }
    }} />;
  }

  // If no flight selected, redirect back
  if (!departureFlight) {
    navigate('/flights');
    return null;
  }

  return (
    <div className="booking">
        <div className="booking-container">
      <h1>Flight Booking</h1>

      {/* Flight Details Section */}
      <div className="flight-details">
        <h2>Departure Flight</h2>
        <div className="flight-card">
          <h3>{departureFlight.airline} - {departureFlight.flightNumber}</h3>
          <p>From: {departureFlight.departureAirport} To: {departureFlight.arrivalAirport}</p>
          <p>Departure: {new Date(departureFlight.departureTime).toLocaleString()}</p>
          <p>Arrival: {new Date(departureFlight.arrivalTime).toLocaleString()}</p>
          <p>Price: RM{departureFlight.price}</p>
          <p>Class: {departureFlight.type}</p>

          {/* Departure Flight Add-ons */}
          <div className="flight-addons">
            <h4>Add-ons:</h4>
            {departureFlight.addons.map((addon, index) => (
              <div key={index} className="addon-item">
                <input 
                  type="checkbox"
                  checked={selectedAddons.departureTripAddons.includes(addon)}
                  onChange={() => handleAddonSelection(departureFlight, addon)}
                />
                <label>{addon.description} - RM{addon.price}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Return Flight Details (if return trip) */}
        {isReturnTrip && returnFlight && (
          <>
            <h2>Return Flight</h2>
            <div className="flight-card">
              <h3>{returnFlight.airline} - {returnFlight.flightNumber}</h3>
              <p>From: {returnFlight.departureAirport} To: {returnFlight.arrivalAirport}</p>
              <p>Departure: {new Date(returnFlight.departureTime).toLocaleString()}</p>
              <p>Arrival: {new Date(returnFlight.arrivalTime).toLocaleString()}</p>
              <p>Price: RM{returnFlight.price}</p>
              <p>Class: {returnFlight.type}</p>

              {/* Return Flight Add-ons */}
              <div className="flight-addons">
                <h4>Add-ons:</h4>
                {returnFlight.addons.map((addon, index) => (
                  <div key={index} className="addon-item">
                    <input 
                      type="checkbox"
                      checked={selectedAddons.returnTripAddons.includes(addon)}
                      onChange={() => handleAddonSelection(returnFlight, addon)}
                    />
                    <label>{addon.description} - RM{addon.price}</label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Passenger Details Form */}
      <form onSubmit={handleBookingSubmit} className="passenger-form">
        <h2>Passenger Details</h2>
        
        <div className="form-group">
          <label>Title</label>
          <select 
            name="title" 
            value={passengerForm.title}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Title</option>
            <option value="Mr.">Mr.</option>
            <option value="Ms.">Ms.</option>
          </select>
        </div>

        <div className="form-group">
          <label>First Name</label>
          <input 
            type="text"
            name="firstName"
            value={passengerForm.firstName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input 
            type="text"
            name="lastName"
            value={passengerForm.lastName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Date of Birth</label>
          <DatePicker
            selected={passengerForm.dateOfBirth}
            onChange={handleDateOfBirthChange}
            placeholderText='Select Date of Birth'
            maxDate={new Date()}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            required
          />
        </div>

        <div className="form-group">
          <label>Nationality</label>
          <input 
            type="text"
            name="nationality"
            value={passengerForm.nationality}
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" className="submit-booking-btn">
          Confirm Booking
        </button>
      </form>
    </div>
    </div>
    
  );
};

export default Booking;