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
    // State for flights and form inputs
    const [flights, setFlights] = useState([]);
    const [departureTripFlights, setDepartureTripFlights] = useState([]);
    const [returnTripFlights, setReturnTripFlights] = useState([]);
    const [selectedDepartureFlight, setSelectedDepartureFlight] = useState(null);
    const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);
    const [allFlights, setAllFlights] = useState([]);
    const [location, setLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [departureDate, setDepartureDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);
    const [activeClass, setActiveClass] = useState('');
    
    // State for IATA codes
    const [iataCodes, setIataCodes] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    //UseEffect to set animation duration ==>
    useEffect(()=>{
        Aos.init({duration: 2000})
        
        // Fetch IATA codes
        const fetchIataCodes = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/iata-codes');
                const data = await response.json();
                setIataCodes(data);
            } catch (error) {
                console.error('Error fetching IATA codes:', error);
            }
        }
        
        fetchIataCodes();
    }, [])

    // Handle location input change
    const handleLocationChange = (value) => {
        setLocation(value);
        
        // Filter suggestions based on input
        const suggestions = iataCodes.filter(code => 
            code.iataCode.toLowerCase().includes(value.toLowerCase()) ||
            code.city.toLowerCase().includes(value.toLowerCase()) ||
            code.airportName.toLowerCase().includes(value.toLowerCase())
        );
        
        setLocationSuggestions(suggestions);
    }

    // Handle destination input change
    const handleDestinationChange = (value) => {
        setDestination(value);
        
        // Filter suggestions based on input
        const suggestions = iataCodes.filter(code => 
            code.iataCode.toLowerCase().includes(value.toLowerCase()) ||
            code.city.toLowerCase().includes(value.toLowerCase()) ||
            code.airportName.toLowerCase().includes(value.toLowerCase())
        );
        
        setDestinationSuggestions(suggestions);
    }

    // Select a location suggestion
    const selectLocationSuggestion = (suggestion) => {
        setLocation(suggestion.iataCode);
        setLocationSuggestions([]);
    }

    // Select a destination suggestion
    const selectDestinationSuggestion = (suggestion) => {
        setDestination(suggestion.iataCode);
        setDestinationSuggestions([]);
    }

    // // Fetch flights from API
    // const fetchFlights = async () => {
    //     try {
    //         const response = await fetch('http://localhost:3000/api/flights');
    //         const data = await response.json();
    //         setFlights(data);
    //         setAllFlights(data);
    //     } catch (error) {
    //         console.error('Error fetching flights:', error);
    //     }
    // }

    // Trigger flight search
    const handleSearch = async () => {
      // Validation for mandatory fields
      if (!location || !destination || !departureDate) {
          alert('Please fill in From, To, and Departure Date');
          return;
      }

      try {
          // Fetch all flights from API
          const response = await fetch('http://localhost:3000/api/flights');
          const allFlights = await response.json();

          // Filter flights based on location, destination, and class
          const filteredFlights = allFlights.filter(flight => 
              flight.departureAirport === location &&
              flight.arrivalAirport === destination &&
              new Date(flight.departureTime).toDateString() === departureDate.toDateString() &&
              (!activeClass || flight.type === activeClass)
          );

          // Single Trip Logic
          if (!returnDate) {
              setDepartureTripFlights(filteredFlights);
              setReturnTripFlights([]);
          } 
          // Return Trip Logic
          else {
              // Departure Trip Flights (From location to destination)
              const departureDayFlights = filteredFlights;
              setDepartureTripFlights(departureDayFlights);

              // Return Trip Flights (From destination back to original location)
              const returnFlights = allFlights.filter(flight => 
                  flight.departureAirport === destination &&
                  flight.arrivalAirport === location &&
                  new Date(flight.departureTime).toDateString() === returnDate.toDateString() &&
                  (!activeClass || flight.type === activeClass)
              );
              setReturnTripFlights(returnFlights);
          }
      } catch (error) {
          console.error('Error fetching flights:', error);
      }
  }

    // Handle class filter
    const handleClassFilter = (flightClass) => {
        setActiveClass(flightClass);
        
        if (flightClass) {
            const filteredFlights = allFlights.filter(flight => flight.type === flightClass);
            setFlights(filteredFlights);
        } else {
            setFlights(allFlights);
        }
    }
    
    return (
    <div className="search container section flight">
      <div data-aos='fade-up' data-aos-duration='2000' className="sectionContainer grid">
        <div className="btns flex">
          <div 
            className={`singleBtn ${activeClass === 'Economy' ? 'active' : ''}`}
            onClick={() => handleClassFilter('Economy')}
          >
            <span>Economy</span>
          </div>

          <div 
            className={`singleBtn ${activeClass === 'Business' ? 'active' : ''}`}
            onClick={() => handleClassFilter('Business')}
          >
            <span>Business</span>
          </div>

          <div 
            className={`singleBtn ${activeClass === 'First Class' ? 'active' : ''}`}
            onClick={() => handleClassFilter('First Class')}
          >
            <span>First Class</span>
          </div>
        </div>

        <div className="searchInputs flex">
          {/* From Input*/}
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

          {/* To Input*/}
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
          
          <button 
            className='btn btnBlock flex' 
            onClick={handleSearch}
          >
            Search Flight
          </button>
        </div>

        {/* Flight Results Section */}
        <div className="flightList">
            <div className="flightResults">
            <h3>Available Flights</h3>
            {flights.length > 0 ? (
                flights.map((flight) => (
                    <div key={flight._id} className="flightCard">
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
                    </div>
                ))
            ) : (
                <p style={{ textAlign: 'center', color: 'var(--greyText)' }}>
                    No flights available for the selected class.
                </p>
            )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default Flights