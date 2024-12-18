import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

//Imported Icons ===========>
import {HiOutlineLocationMarker} from 'react-icons/hi'
import {RiAccountPinCircleLine} from 'react-icons/ri'
import {RxCalendar} from 'react-icons/rx'

// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'

const Flights = () => {
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

    return (
        <div className="search container section flight">
            <div  className="sectionContainer grid">
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
                                    onClick={() => setSelectedDepartureFlight(flight)}
                                >
                                    <div className="flightInfo">
                                        <h4>{flight.airline} - {flight.flightNumber}</h4>
                                        <p>From: {flight.departureAirport} To: {flight.arrivalAirport}</p>
                                        <p>Departure: {new Date(flight.departureTime).toLocaleString()}</p>
                                        <p>Arrival: {new Date(flight.arrivalTime).toLocaleString()}</p>
                                        <p>Price: ${flight.price}</p>
                                        <p>Available Seats: {flight.availableSeats}</p>
                                        <p>Class: {flight.type}</p>
                                    </div>
                                    <div className="flightAddons">
                                        <h5>Add-ons:</h5>
                                        {flight.addons.map((addon, index) => (
                                            <div key={index} className="addon">
                                                <p>{addon.description} - ${addon.price}</p>
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
                                            <p>Price: ${flight.price}</p>
                                            <p>Available Seats: {flight.availableSeats}</p>
                                            <p>Class: {flight.type}</p>
                                        </div>
                                        <div className="flightAddons">
                                        <h5>Add-ons:</h5>
                                        {flight.addons.map((addon, index) => (
                                            <div key={index} className="addon">
                                                <p>{addon.description} - ${addon.price}</p>
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
                </div>
            </div>
        </div>
    );
};

export default Flights;