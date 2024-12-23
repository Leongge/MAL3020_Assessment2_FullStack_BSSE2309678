import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SignIn from './SignIn';
import QRCode from 'qrcode';

// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignIn, setShowSignIn] = useState(false);
  const [mainPassenger, setMainPassenger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Flight details passed from previous page
  const { 
    departureFlight, 
    returnFlight, 
    isReturnTrip 
  } = location.state || {};

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // New state for passenger counts
  const [passengerCounts, setPassengerCounts] = useState({
    adult: 0, // Changed to 0 since main passenger is separate
    child: 0,
    infant: 0,
  });

  // Modified passenger form state to handle multiple passengers
  const [passengerForms, setPassengerForms] = useState([]);

  // Add-ons state
  const [selectedAddons, setSelectedAddons] = useState({
    departureTripAddons: [],
    returnTripAddons: []
  });

  // Add new state for storing generated QR codes
  const [qrCodes, setQrCodes] = useState({
    mainPassenger: '',
    additionalPassengers: {}
  });

  // Function to generate QR code
  const generateQRCode = async (data) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(data));
      return qrCodeDataUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
      return null;
    }
  };

  // Function to prepare flight data
  const prepareFlightData = async (flight, mainPassengerData) => {
    return {
      flightId: flight.flightNumber,
      departureDate: flight.departureTime,
      arrivalDate: flight.arrivalTime,
      departureLocation: flight.departureAirport,
      arrivalLocation: flight.arrivalAirport,
      mainPassengers: [{
        name: mainPassengerData.name,
        email: mainPassengerData.email,
        phone: mainPassengerData.phone,
        Address: mainPassengerData.address,
        IdentityNo: mainPassengerData.identityNo,
        qrCode: await generateQRCode({
          flightNumber: flight.flightNumber,
          passengerName: mainPassengerData.name,
          type: 'mainPassenger'
        })
      }]
    };
  };

useEffect(() => {
    const fetchUserData = async (email) => {
      try {
        const response = await fetch('http://localhost:3000/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const users = await response.json();
        const userDetails = users.find(user => user.email === email);
        
        if (userDetails) {
          setMainPassenger(userDetails);
        } else {
          throw new Error('User not found');
        }
      } catch (error) {
        setError(error.message);
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check login status on component mount
    const session = localStorage.getItem('userSession');
    if (session) {
      const sessionData = JSON.parse(session);
      const currentTime = new Date().getTime();
      
      // Check if session is still valid (within 10 minutes)
      if (currentTime - sessionData.timestamp < 10 * 60 * 1000) {
        setIsLoggedIn(true);
        fetchUserData(sessionData.email);
      } else {
        localStorage.removeItem('userSession');
        setShowSignIn(true);
        setLoading(false);
      }
    } else {
      setShowSignIn(true);
      setLoading(false);
    }
  }, []);

  // Handle passenger count changes
  const handlePassengerCountChange = (type, action) => {
    setPassengerCounts(prev => {
      const newCount = action === 'increase' 
        ? prev[type] + 1 
        : Math.max(0, prev[type] - 1);

      const newCounts = { ...prev, [type]: newCount };
      
      // Update passenger forms based on new counts
      const totalPassengers = newCounts.adult + newCounts.child;
      const newForms = [];
      
      // Add adult forms
      for (let i = 0; i < newCounts.adult; i++) {
        newForms.push(passengerForms[i] || {
          type: 'adult',
          title: '',
          fullName: '',
          dateOfBirth: null,
          nationality: ''
        });
      }
      
      // Add child forms
      for (let i = 0; i < newCounts.child; i++) {
        newForms.push(passengerForms[newCounts.adult + i] || {
          type: 'child',
          title: '',
          fullName: '',
          dateOfBirth: null,
          nationality: ''
        });
      }
      
      setPassengerForms(newForms);
      return newCounts;
    });
  };

  // Handle form input changes for multiple passengers
  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    setPassengerForms(prev => {
      const newForms = [...prev];
      newForms[index] = {
        ...newForms[index],
        [name]: value
      };
      return newForms;
    });
  };

  // Handle date of birth change for multiple passengers
  const handleDateOfBirthChange = (index, date) => {
    setPassengerForms(prev => {
      const newForms = [...prev];
      newForms[index] = {
        ...newForms[index],
        dateOfBirth: date
      };
      return newForms;
    });
  };

  // Handle addon selection
  const handleAddonSelection = (flight, addon) => {
    setSelectedAddons(prev => {
      const isReturnTrip = flight === departureFlight ? 'departureTripAddons' : 'returnTripAddons';
      const currentAddons = prev[isReturnTrip];
      
      const updatedAddons = currentAddons.includes(addon)
        ? currentAddons.filter(a => a !== addon)
        : [...currentAddons, addon];

      return {
        ...prev,
        [isReturnTrip]: updatedAddons
      };
    });
  };

  // Calculate detailed price breakdown
  const calculatePriceBreakdown = () => {
    const breakdown = {
      mainPassenger: {
        departureFlight: departureFlight.price,
        returnFlight: isReturnTrip && returnFlight ? returnFlight.price : 0,
        addons: 0
      },
      additionalAdults: {
        count: passengerCounts.adult,
        departureFlight: departureFlight.price * passengerCounts.adult,
        returnFlight: isReturnTrip && returnFlight ? returnFlight.price * passengerCounts.adult : 0,
        addons: 0
      },
      children: {
        count: passengerCounts.child,
        departureFlight: (departureFlight.price * 0.5) * passengerCounts.child, // 50% of adult price
        returnFlight: isReturnTrip && returnFlight ? (returnFlight.price * 0.5) * passengerCounts.child : 0,
        addons: 0
      },
      addons: {
        departure: selectedAddons.departureTripAddons.map(addon => ({
          description: addon.description,
          price: addon.price * (1 + passengerCounts.adult + passengerCounts.child) // For all passengers including main
        })),
        return: selectedAddons.returnTripAddons.map(addon => ({
          description: addon.description,
          price: addon.price * (1 + passengerCounts.adult + passengerCounts.child)
        }))
      }
    };

    // Calculate total addons
    breakdown.mainPassenger.addons = [...selectedAddons.departureTripAddons, ...selectedAddons.returnTripAddons]
      .reduce((total, addon) => total + addon.price, 0);

    breakdown.additionalAdults.addons = breakdown.mainPassenger.addons * passengerCounts.adult;
    breakdown.children.addons = breakdown.mainPassenger.addons * passengerCounts.child;

    // Calculate total
    breakdown.total = (
      breakdown.mainPassenger.departureFlight +
      breakdown.mainPassenger.returnFlight +
      breakdown.mainPassenger.addons +
      breakdown.additionalAdults.departureFlight +
      breakdown.additionalAdults.returnFlight +
      breakdown.additionalAdults.addons +
      breakdown.children.departureFlight +
      breakdown.children.returnFlight +
      breakdown.children.addons
    );

    return breakdown;
  };

  // Handle booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate passenger forms
      const isValid = passengerForms.length === 0 || passengerForms.every(form => 
        form.title && form.fullName && form.dateOfBirth && form.nationality
      );

      if (!isValid) {
        alert('Please fill in all passenger details');
        return;
      }

      // Prepare flights data
      const flights = [];
      
      // Add departure flight
    const departureTripData = {
      flightId: departureFlight.flightNumber,
      departureDate: departureFlight.departureTime,
      arrivalDate: departureFlight.arrivalTime,
      departureLocation: departureFlight.departureAirport,
      arrivalLocation: departureFlight.arrivalAirport,
      mainPassengers: [{
        name: mainPassenger.name,
        email: mainPassenger.email,
        phone: mainPassenger.phone,
        Address: mainPassenger.address,
        IdentityNo: mainPassenger.identityNo,
        qrCode: "encrypted_qr_main_passenger" // This will be handled by backend
      }]
    };
    flights.push(departureTripData);

      // Add return flight if it exists
    if (isReturnTrip && returnFlight) {
      const returnTripData = {
        flightId: returnFlight.flightNumber,
        departureDate: returnFlight.departureTime,
        arrivalDate: returnFlight.arrivalTime,
        departureLocation: returnFlight.departureAirport,
        arrivalLocation: returnFlight.arrivalAirport,
        mainPassengers: [{
          name: mainPassenger.name,
          email: mainPassenger.email,
          phone: mainPassenger.phone,
          Address: mainPassenger.address,
          IdentityNo: mainPassenger.identityNo,
          qrCode: "encrypted_qr_main_passenger" // This will be handled by backend
        }]
      };
      flights.push(returnTripData);
    }

      // Prepare addons
      const addons = [];
      
      // Add departure flight addons
      selectedAddons.departureTripAddons.forEach(addon => {
        addons.push({
          type: addon.description.toLowerCase(),
          price: addon.price
        });
      });

      // Add return flight addons
      selectedAddons.returnTripAddons.forEach(addon => {
        addons.push({
          type: addon.description.toLowerCase(),
          price: addon.price
        });
      });

      // Prepare additional passengers
      const additionalPassengers = passengerForms.map((passenger, index) => ({
        id: `AP${String(index + 1).padStart(3, '0')}`,
        title: passenger.title,
        name: passenger.fullName,
        dateOfBirth: passenger.dateOfBirth.toISOString().split('T')[0],
        nationality: passenger.nationality,
        qrCode: `encrypted_qr_AP${String(index + 1).padStart(3, '0')}` // This will be handled by backend
      }));

      // Calculate total price
      const priceBreakdown = calculatePriceBreakdown();

      // Prepare final booking data
      const bookingData = {
        userId: mainPassenger._id,
        flights: flights,
        addons: addons,
        totalPrice: priceBreakdown.total,
        additionalPassengers: additionalPassengers
      };

      // Send booking data to API
      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const result = await response.json();
      console.log('Booking created:', result);

      // Navigate to confirmation page
      navigate('/confirmation', { 
        state: { 
          bookingData: result.bookingDetails
        }
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  // If loading, show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If error occurred
  if (error) {
    return <div>Error: {error}</div>;
  }

  // If not logged in, show sign-in popup
  if (showSignIn) {
    return <SignIn onClose={() => {
      const session = localStorage.getItem('userSession');
      if (session) {
        setShowSignIn(false);
        setIsLoggedIn(true);
        setMainPassenger(JSON.parse(session).user);
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

  const priceBreakdown = calculatePriceBreakdown();

  return (
    <div className="booking">
      <div className="booking-container">
        <h1>Flight Booking</h1>

        {/* Main Passenger Info */}
        {mainPassenger && (
          <div className="main-passenger-info">
            <h2>Main Passenger Information</h2>
            <div className="passenger-details">
              <p>
                <strong>Name:</strong> {mainPassenger.name}
              </p>
              <p>
                <strong>Email:</strong> {mainPassenger.email}
              </p>
              <p>
                <strong>Phone:</strong> {mainPassenger.phone}
              </p>
              <p>
                <strong>Address:</strong> {mainPassenger.address}
              </p>
              <p>
                <strong>Identity No:</strong> {mainPassenger.identityNo}
              </p>
            </div>
          </div>
        )}

        {/* Passenger Count Section */}
        <div className="passenger-count-section">
          <h2>Additional Passengers</h2>
          <div className="passenger-type-controls">
            <div className="passenger-type">
              <span>Additional Adults (12+ years)</span>
              <div className="counter-controls">
                <button 
                  onClick={() => handlePassengerCountChange('adult', 'decrease')}
                  className="counter-btn"
                  disabled={passengerCounts.adult <= 0}
                >
                  -
                </button>
                <span className="count">{passengerCounts.adult}</span>
                <button 
                  onClick={() => handlePassengerCountChange('adult', 'increase')}
                  className="counter-btn"
                >
                  +
                </button>
              </div>
            </div>

            <div className="passenger-type">
              <span>Children (2-11 years)</span>
              <div className="counter-controls">
                <button 
                  onClick={() => handlePassengerCountChange('child', 'decrease')}
                  className="counter-btn"
                  disabled={passengerCounts.child <= 0}
                >
                  -
                </button>
                <span className="count">{passengerCounts.child}</span>
                <button 
                  onClick={() => handlePassengerCountChange('child', 'increase')}
                  className="counter-btn"
                >
                  +
                </button>
              </div>
            </div>

            <div className="passenger-type">
              <span>Infants (under 2 years)</span>
              <div className="counter-controls">
                <button 
                  onClick={() => handlePassengerCountChange('infant', 'decrease')}
                  className="counter-btn"
                  disabled={passengerCounts.infant <= 0}
                >
                  -
                </button>
                <span className="count">{passengerCounts.infant}</span>
                <button 
                  onClick={() => handlePassengerCountChange('infant', 'increase')}
                  className="counter-btn"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

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

        {/* Additional Passenger Forms - Only show if there are additional passengers */}
        {(passengerCounts.adult > 0 || passengerCounts.child > 0) && (
          <form onSubmit={handleBookingSubmit} className="passenger-forms">
            {passengerForms.map((form, index) => (
              <div key={index} className="passenger-form">
                <h2>
                {form.type === 'adult' ? 'Adult' : 'Child'} Passenger {index + 1}
                </h2>
                
                <div className="form-group">
                  <label>Title</label>
                  <select 
                    name="title" 
                    value={form.title}
                    onChange={(e) => handleInputChange(index, e)}
                    required
                  >
                    <option value="">Select Title</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    {form.type === 'child' && <option value="Mstr.">Mstr.</option>}
                    {form.type === 'child' && <option value="Miss">Miss</option>}
                  </select>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={(e) => handleInputChange(index, e)}
                    required
                  />
                </div>

                {/* <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={(e) => handleInputChange(index, e)}
                    required
                  />
                </div> */}

                <div className="form-group">
                  <label>Date of Birth</label>
                  <DatePicker
                    selected={form.dateOfBirth}
                    onChange={(date) => handleDateOfBirthChange(index, date)}
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
                    value={form.nationality}
                    onChange={(e) => handleInputChange(index, e)}
                    required
                  />
                </div>
              </div>
            ))}
          </form>
        )}

        {/* Detailed Price Breakdown */}
        <div className="price-breakdown">
          <h2>Price Breakdown</h2>
          
          {/* Main Passenger */}
          <div className="breakdown-section">
            <h3>Main Passenger</h3>
            <div className="breakdown-item">
              <span>Departure Flight:</span>
              <span>RM {priceBreakdown.mainPassenger.departureFlight}</span>
            </div>
            {isReturnTrip && (
              <div className="breakdown-item">
                <span>Return Flight:</span>
                <span>RM {priceBreakdown.mainPassenger.returnFlight}</span>
              </div>
            )}
            <div className="breakdown-item">
              <span>Add-ons:</span>
              <span>RM {priceBreakdown.mainPassenger.addons}</span>
            </div>
          </div>

          {/* Additional Adults */}
          {priceBreakdown.additionalAdults.count > 0 && (
            <div className="breakdown-section">
              <h3> Adults ({priceBreakdown.additionalAdults.count})</h3>
              <div className="breakdown-item">
                <span>Departure Flights:</span>
                <span>RM {priceBreakdown.additionalAdults.departureFlight}</span>
              </div>
              {isReturnTrip && (
                <div className="breakdown-item">
                  <span>Return Flights:</span>
                  <span>RM {priceBreakdown.additionalAdults.returnFlight}</span>
                </div>
              )}
              <div className="breakdown-item">
                <span>Add-ons:</span>
                <span>RM {priceBreakdown.additionalAdults.addons}</span>
              </div>
            </div>
          )}

          {/* Children */}
          {priceBreakdown.children.count > 0 && (
            <div className="breakdown-section">
              <h3>Children ({priceBreakdown.children.count})</h3>
              <div className="breakdown-item">
                <span>Departure Flights:</span>
                <span>RM {priceBreakdown.children.departureFlight}</span>
              </div>
              {isReturnTrip && (
                <div className="breakdown-item">
                  <span>Return Flights:</span>
                  <span>RM {priceBreakdown.children.returnFlight}</span>
                </div>
              )}
              <div className="breakdown-item">
                <span>Add-ons:</span>
                <span>RM {priceBreakdown.children.addons}</span>
              </div>
            </div>
          )}

          {/* Add-ons Breakdown */}
          {/* {(priceBreakdown.addons.departure.length > 0 || priceBreakdown.addons.return.length > 0) && (
            <div className="breakdown-section">
              <h3>Add-ons Breakdown</h3>
              {priceBreakdown.addons.departure.map((addon, index) => (
                <div key={index} className="breakdown-item">
                  <span>{addon.description}:</span>
                  <span>RM {addon.price}</span>
                </div>
              ))}
              {priceBreakdown.addons.return.map((addon, index) => (
                <div key={index} className="breakdown-item">
                  <span>{addon.description} (Return):</span>
                  <span>RM {addon.price}</span>
                </div>
              ))}
            </div>
          )} */}

          {/* Total */}
          <div className="breakdown-total">
            <h3>Total Price</h3>
            <div className="breakdown-item total">
              <span>Total:</span>
              <span>RM {priceBreakdown.total}</span>
            </div>
          </div>
        </div>

        <button onClick={handleBookingSubmit} className="submit-booking-btn">
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default Booking;