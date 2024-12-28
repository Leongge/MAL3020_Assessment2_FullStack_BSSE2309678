import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { io } from 'socket.io-client';

//Imported Icons ===========>
import {HiOutlineLocationMarker} from 'react-icons/hi'
import {RiAccountPinCircleLine} from 'react-icons/ri'
import {RxCalendar} from 'react-icons/rx'

// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'

// Import SignIn component
import SignIn from './SignIn'

const socket = io('http://localhost:3000');

const Flights = () => {
    const navigate = useNavigate();
    
    // State for flight search and filtering
    const [flights, setFlights] = useState([]);
    const [departureTripFlights, setDepartureTripFlights] = useState([]);
    const [returnTripFlights, setReturnTripFlights] = useState([]);
    
    // State for form inputs and selections
    const [location, setLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [departureDate, setDepartureDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);
    
    // State for flight class and suggestions
    const [activeClass, setActiveClass] = useState('');
    const [selectedDepartureFlight, setSelectedDepartureFlight] = useState(null);
    const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);

    // State for IATA code suggestions
    const [iataCodes, setIataCodes] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    // State for SignIn popup
    const [showSignIn, setShowSignIn] = useState(false);
    const [bookingContext, setBookingContext] = useState(null);
    const [updateMessage, setUpdateMessage] = useState('');

    // Initialize AOS and fetch IATA codes on component mount
    useEffect(() => {
        Aos.init({ duration: 2000 });
        
        const fetchIataCodes = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/iata-codes');
                const data = await response.json();
                setIataCodes(data);
            } catch (error) {
                console.error('Error fetching IATA codes:', error);
            }
        };
        
        fetchIataCodes();
        socket.on('flightUpdated', (updatedFlight) => {
            setUpdateMessage('Flight information has been updated!');
            setTimeout(() => setUpdateMessage(''), 3000);
            console.log('Flight updated:', updatedFlight);
            
            setDepartureTripFlights(prev => 
                prev.map(flight => 
                    flight._id === updatedFlight._id ? updatedFlight : flight
                )
            );

            setReturnTripFlights(prev => 
                prev.map(flight => 
                    flight._id === updatedFlight._id ? updatedFlight : flight
                )
            );

            if (selectedDepartureFlight?._id === updatedFlight._id) {
                setSelectedDepartureFlight(updatedFlight);
            }
            if (selectedReturnFlight?._id === updatedFlight._id) {
                setSelectedReturnFlight(updatedFlight);
            }
        });

        return () => {
            socket.off('flightUpdated');
        };
        
    }, []);

    // Handle location input change with autocomplete suggestions
    const handleLocationChange = (value) => {
        setLocation(value);
        
        const suggestions = iataCodes.filter(code => 
            code.iataCode.toLowerCase().includes(value.toLowerCase()) ||
            code.city.toLowerCase().includes(value.toLowerCase()) ||
            code.airportName.toLowerCase().includes(value.toLowerCase())
        );
        
        setLocationSuggestions(suggestions);
    };

    // Handle destination input change with autocomplete suggestions
    const handleDestinationChange = (value) => {
        setDestination(value);
        
        const suggestions = iataCodes.filter(code => 
            code.iataCode.toLowerCase().includes(value.toLowerCase()) ||
            code.city.toLowerCase().includes(value.toLowerCase()) ||
            code.airportName.toLowerCase().includes(value.toLowerCase())
        );
        
        setDestinationSuggestions(suggestions);
    };

    // Select a location suggestion and clear suggestions
    const selectLocationSuggestion = (suggestion) => {
        setLocation(suggestion.iataCode);
        setLocationSuggestions([]);
    };

    // Select a destination suggestion and clear suggestions
    const selectDestinationSuggestion = (suggestion) => {
        setDestination(suggestion.iataCode);
        setDestinationSuggestions([]);
    };

    // Handle flight class filter
    const handleClassFilter = (flightClass) => {
        setActiveClass(flightClass);
    };

    // Check login status before navigation
    const checkLoginAndNavigate = (context) => {
        const session = localStorage.getItem('userSession');
        if (!session) {
            // Set booking context and show sign-in popup
            setBookingContext(context);
            setShowSignIn(true);
        } else {
            // Navigate directly to booking
            navigateToBooking(context);
        }
    };

    // Navigate to booking page
    const navigateToBooking = (context) => {
        navigate('/booking', { 
            state: context
        });
    };

    // Handle single trip flight selection
    const handleSingleTripFlightSelection = (flight) => {
        if (returnDate) {
            // If return date is selected, just mark the departure flight
            setSelectedDepartureFlight(flight);
        } else {
            // For single trip, navigate to booking
            checkLoginAndNavigate({ 
                departureFlight: flight, 
                isReturnTrip: false 
            });
        }
    };

    // Handle return trip booking
    const handleReturnTripBooking = () => {
        // Ensure both departure and return flights are selected
        if (!selectedDepartureFlight || !selectedReturnFlight) {
            alert('Please select both departure and return flights');
            return;
        }

        // Check login and navigate
        checkLoginAndNavigate({ 
            departureFlight: selectedDepartureFlight, 
            returnFlight: selectedReturnFlight,
            isReturnTrip: true 
        });
    };

    // Main flight search handler
    const handleSearch = async () => {
        // Validate mandatory fields
        if (!location || !destination || !departureDate) {
            alert('Please fill in From, To, and Departure Date');
            return;
        }

        try {
            // Fetch all flights from API
            const response = await fetch('http://localhost:3000/api/flights');
            const allFlights = await response.json();

            // Filter flights based on search criteria
            const filteredDepartureFlights = allFlights.filter(flight => 
                flight.departureAirport === location &&
                flight.arrivalAirport === destination &&
                new Date(flight.departureTime).toDateString() === departureDate.toDateString() &&
                (!activeClass || flight.type === activeClass)
            );

            // Single trip logic
            if (!returnDate) {
                setDepartureTripFlights(filteredDepartureFlights);
                setReturnTripFlights([]);
                setSelectedDepartureFlight(null);
                setSelectedReturnFlight(null);
            } 
            // Return trip logic
            else {
                // Departure trip flights
                setDepartureTripFlights(filteredDepartureFlights);

                // Return trip flights
                const filteredReturnFlights = allFlights.filter(flight => 
                    flight.departureAirport === destination &&
                    flight.arrivalAirport === location &&
                    new Date(flight.departureTime).toDateString() === returnDate.toDateString() &&
                    (!activeClass || flight.type === activeClass)
                );
                
                setReturnTripFlights(filteredReturnFlights);
                setSelectedDepartureFlight(null);
                setSelectedReturnFlight(null);
            }
        } catch (error) {
            console.error('Error fetching flights:', error);
        }
    };

    // Handle login success
    const handleLoginSuccess = () => {
        // Close sign-in popup
        setShowSignIn(false);
        
        // If there's a booking context, navigate to booking
        if (bookingContext) {
            navigateToBooking(bookingContext);
            // Reset booking context
            setBookingContext(null);
        }
    };

    return (
        <div className="search container section flight">
            {/* Show SignIn popup if needed */}
            {showSignIn && (
                <SignIn 
                    onClose={() => setShowSignIn(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            <div className="sectionContainer grid">
                    {updateMessage && (
                        <div className="update-message" style={{
                            position: 'center',
                            top: '20px',
                            right: '20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            zIndex: 1000,
                            animation: 'fadeIn 0.3s'
                        }}>
                            {updateMessage}
                        </div>
                    )}
                {/* Flight Class Selection */}
                <div className="btns flex">
                    {['Economy', 'Business', 'First Class'].map(flightClass => (
                        <div 
                            key={flightClass}
                            className={`singleBtn ${activeClass === flightClass ? 'active' : ''}`}
                            onClick={() => handleClassFilter(flightClass)}
                        >
                            <span>{flightClass}</span>
                        </div>
                    ))}
                </div>

                {/* Search Inputs */}
                <div className="searchInputs flex">
                    {/* From Input */}
                    <div className="singleInput flex">
                        <div className="iconDiv">
                            <HiOutlineLocationMarker className='icon'/>
                        </div>
                        <div className="texts">
                            <h4>From</h4>
                            <div className="autocomplete-container">
                                <input 
                                    type="text" 
                                    placeholder='Where' 
                                    value={location}
                                    onChange={(e) => handleLocationChange(e.target.value)}
                                />
                                {locationSuggestions.length > 0 && (
                                    <ul className="suggestions-list">
                                        {locationSuggestions.map((suggestion, index) => (
                                            <li 
                                                key={index} 
                                                onClick={() => selectLocationSuggestion(suggestion)}
                                            >
                                                {suggestion.iataCode} - {suggestion.city} ({suggestion.airportName})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* To Input */}
                    <div className="singleInput flex">
                        <div className="iconDiv">
                            <HiOutlineLocationMarker className='icon'/>
                        </div>
                        <div className="texts">
                            <h4>To</h4>
                            <div className="autocomplete-container">
                                <input 
                                    type="text" 
                                    placeholder='Where you want to go'
                                    value={destination}
                                    onChange={(e) => handleDestinationChange(e.target.value)}
                                />
                                {destinationSuggestions.length > 0 && (
                                    <ul className="suggestions-list">
                                        {destinationSuggestions.map((suggestion, index) => (
                                            <li 
                                                key={index} 
                                                onClick={() => selectDestinationSuggestion(suggestion)}
                                            >
                                                {suggestion.iataCode} - {suggestion.city} ({suggestion.airportName})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Departure Date Input */}
                    <div className="singleInput flex">
                        <div className="iconDiv">
                            <RxCalendar className='icon'/>
                        </div>
                        <div className="texts">
                            <h4>Departure</h4>
                            <DatePicker
                                selected={departureDate}
                                onChange={(date) => setDepartureDate(date)}
                                placeholderText='Add date'
                                className='datepicker-input'
                                minDate={new Date()}
                                data-testid="departure-date-input"
                            />
                        </div>
                    </div>

                    {/* Return Date Input */}
                    <div className="singleInput flex">
                        <div className="iconDiv">
                            <RxCalendar className='icon'/>
                        </div>
                        <div className="texts">
                            <h4>Return</h4>
                            <DatePicker
                                selected={returnDate}
                                onChange={(date) => setReturnDate(date)}
                                placeholderText='Add date'
                                className='datepicker-input'
                                minDate={departureDate || new Date()}
                                data-testid="return-date-input"
                            />
                        </div>
                    </div>
                    
                    {/* Search Button */}
                    <button 
                        className='btn btnBlock flex' 
                        onClick={handleSearch}
                    >
                        Search Flight
                    </button>
                </div>

                {/* Departure Trip Flights */}
                <div className="flightList">
                    <div className="departureTripFlights">
                        <h3 className='listTitle'>Departure Flights</h3>
                        {departureTripFlights.length > 0 ? (
                            departureTripFlights.map((flight) => (
                                <div 
                                    key={flight._id} 
                                    className={`flightCard ${selectedDepartureFlight?._id === flight._id ? 'selected' : ''}`}
                                    onClick={() => handleSingleTripFlightSelection(flight)}
                                >
                                    <div className="flightInfo">
                                        <h4>{flight.airline} - {flight.flightNumber}</h4>
                                        <p>From: {flight.departureAirport} To: {flight.arrivalAirport}</p>
                                        <p>Departure: {new Date(flight.departureTime).toLocaleString()}</p>
                                        <p>Arrival: {new Date(flight.arrivalTime).toLocaleString()}</p>
                                        <p>Price: RM{flight.price}</p>
                                        <p>Available Seats: {flight.availableSeats}</p>
                                        <p>Class: {flight.type}</p>
                                    </div>
                                    <div className="flightAddons">
                                        <h5>Add-ons:</h5>
                                        {flight.addons.map((addon, index) => (
                                            <div key={index} className="addon">
                                                <p>{addon.description} - RM{addon.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {returnDate && (
                                        <div className="selectionCircle">
                                            {selectedDepartureFlight?._id === flight._id ? '✓' : ''}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--greyText)' }}>
                                No departure flights available.
                            </p>
                        )}
                    </div>

                    {/* Return Trip Flights (if return date selected) */}
                    {returnDate && (
                        <div className="returnTripFlights">
                            <h3>Return Flights</h3>
                            {returnTripFlights.length > 0 ? (
                                returnTripFlights.map((flight) => (
                                    <div 
                                        key={flight._id} 
                                        className={`flightCard ${selectedReturnFlight?._id === flight._id ? 'selected' : ''}`}
                                        onClick={() => setSelectedReturnFlight(flight)}
                                    >
                                        <div className="flightInfo">
                                            <h4>{flight.airline} - {flight.flightNumber}</h4>
                                            <p>From: {flight.departureAirport} To: {flight.arrivalAirport}</p>
                                            <p>Departure: {new Date(flight.departureTime).toLocaleString()}</p>
                                            <p>Arrival: {new Date(flight.arrivalTime).toLocaleString()}</p>
                                            <p>Price: RM{flight.price}</p>
                                            <p>Available Seats: {flight.availableSeats}</p>
                                            <p>Class: {flight.type}</p>
                                        </div>
                                        <div className="flightAddons">
                                            <h5>Add-ons:</h5>
                                            {flight.addons.map((addon, index) => (
                                                <div key={index} className="addon">
                                                    <p>{addon.description} - RM{addon.price}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="selectionCircle">
                                            {selectedReturnFlight?._id === flight._id ? '✓' : ''}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--greyText)' }}>
                                    No return flights available.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Proceed to Booking Button for Return Trips */}
                    {returnDate && selectedDepartureFlight && selectedReturnFlight && (
                        <button 
                            className='btn btnBlock flex' 
                            onClick={handleReturnTripBooking}
                        >
                            Proceed to Booking
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Flights;