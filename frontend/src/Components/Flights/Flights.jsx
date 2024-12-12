import React, { useEffect, useState } from 'react'

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
    const [allFlights, setAllFlights] = useState([]);
    const [location, setLocation] = useState('');
    const [travelers, setTravelers] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [activeClass, setActiveClass] = useState('');

    //UseEffect to set animation duration ==>
    useEffect(()=>{
        Aos.init({duration: 2000})
    }, [])

    // Fetch flights from API
    const fetchFlights = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/flights');
            const data = await response.json();
            setFlights(data);
            setAllFlights(data);
        } catch (error) {
            console.error('Error fetching flights:', error);
        }
    }

    // Trigger flight search
    const handleSearch = () => {
        fetchFlights();
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
          {/* Single Input*/}
          <div className="singleInput flex">
            <div className="iconDiv">
              <HiOutlineLocationMarker className='icon'/>
            </div>
            <div className="texts">
              <h4>From</h4>
              <input 
                type="text" 
                placeholder='Where' 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Single Input*/}
          <div className="singleInput flex">
            <div className="iconDiv">
              <HiOutlineLocationMarker className='icon'/>
            </div>
            <div className="texts">
              <h4>To</h4>
              <input 
                type="text" 
                placeholder='Where you want to go'
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
              />
            </div>
          </div>

          {/* Single Input*/}
          <div className="singleInput flex">
            <div className="iconDiv">
              <RxCalendar className='icon'/>
            </div>
            <div className="texts">
              <h4>Departure</h4>
              <input 
                type="text" 
                placeholder='Add date'
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          </div>

          {/* Single Input*/}
          <div className="singleInput flex">
            <div className="iconDiv">
              <RxCalendar className='icon'/>
            </div>
            <div className="texts">
              <h4>Return</h4>
              <input 
                type="text" 
                placeholder='Add date'
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
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