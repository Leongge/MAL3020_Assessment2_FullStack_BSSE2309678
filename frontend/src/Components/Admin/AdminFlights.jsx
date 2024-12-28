import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import io from 'socket.io-client';
// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'

// const socket = io('http://localhost:3000');

const AdminFlights = () => {
    const [flights, setFlights] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingFlight, setEditingFlight] = useState(null);
    const [iataCodes, setIataCodes] = useState([]);
    const [formData, setFormData] = useState({
        airline: '',
        flightNumber: '',
        departureAirport: '',
        arrivalAirport: '',
        departureTime: null,
        arrivalTime: null,
        price: '',
        availableSeats: '',
        type: 'Economy',
        addons: []
    });
    const [departureSearch, setDepartureSearch] = useState('');
    const [arrivalSearch, setArrivalSearch] = useState('');
    const [departureSuggestions, setDepartureSuggestions] = useState([]);
    const [arrivalSuggestions, setArrivalSuggestions] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                const flightResponse = await fetch('http://localhost:3000/api/flights');
                const flightData = await flightResponse.json();
                setFlights(flightData);

                const iataResponse = await fetch('http://localhost:3000/api/iata-codes');
                const iataData = await iataResponse.json();
                console.log('IATA data received:', iataData);
                setIataCodes(Array.isArray(iataData) ? iataData : []);
    
                
            } catch (error) {
                console.error('Error during initialization:', error);
            }
        };
    
        init();

        // // Socket listeners
        // socket.on('flightUpdated', (updatedFlight) => {
        //     setFlights(prevFlights => 
        //         prevFlights.map(flight => 
        //             flight._id === updatedFlight._id ? updatedFlight : flight
        //         )
        //     );
        // });

        // return () => {
        //     socket.off('flightUpdated');
        // };
    }, []);

    const fetchFlights = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/flights');
            const data = await response.json();
            setFlights(data);
        } catch (error) {
            console.error('Error fetching flights:', error);
        }
    };

    // const fetchIataCodes = async () => {
    //     try {
    //         const response = await fetch('http://localhost:3000/api/iata-codes');
    //         const data = await response.json();
    //         console.log('Raw IATA data:', data);
    //         setIataCodes(Array.isArray(data) ? data : []);
    //     } catch (error) {
    //         console.error('Error fetching IATA codes:', error);
    //     }
    // };

    const handleSearch = (value, type) => {
        const filteredCodes = iataCodes.filter(code =>
            code.iataCode.toLowerCase().includes(value.toLowerCase()) ||
            code.city.toLowerCase().includes(value.toLowerCase()) ||
            code.airportName.toLowerCase().includes(value.toLowerCase())
        );

        if (type === 'departure') {
            setDepartureSearch(value);
            setDepartureSuggestions(filteredCodes);
            setFormData({ ...formData, departureAirport: value });
        } else {
            setArrivalSearch(value);
            setArrivalSuggestions(filteredCodes);
            setFormData({ ...formData, arrivalAirport: value });
        }
    };

    const handleSelectIATA = (code, type) => {
        if (type === 'departure') {
            setFormData({ ...formData, departureAirport: code.iataCode });
            setDepartureSearch(code.iataCode);
            setDepartureSuggestions([]);
        } else {
            setFormData({ ...formData, arrivalAirport: code.iataCode });
            setArrivalSearch(code.iataCode);
            setArrivalSuggestions([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingFlight 
            ? `http://localhost:3000/api/flights/${editingFlight._id}`
            : 'http://localhost:3000/api/flights';
        
        const method = editingFlight ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                fetchFlights();
                setShowModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving flight:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this flight?')) {
            try {
                await fetch(`http://localhost:3000/api/flights/${id}`, {
                    method: 'DELETE'
                });
                fetchFlights();
            } catch (error) {
                console.error('Error deleting flight:', error);
            }
        }
    };

    const handleEdit = (flight) => {
        setEditingFlight(flight);
        setFormData({
            ...flight,
            departureTime: new Date(flight.departureTime),
            arrivalTime: new Date(flight.arrivalTime)
        });
        setDepartureSearch(flight.departureAirport);
        setArrivalSearch(flight.arrivalAirport);
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingFlight(null);
        setFormData({
            airline: '',
            flightNumber: '',
            departureAirport: '',
            arrivalAirport: '',
            departureTime: null,
            arrivalTime: null,
            price: '',
            availableSeats: '',
            type: 'Economy',
            addons: []
        });
        setDepartureSearch('');
        setArrivalSearch('');
    };

    const handleAddAddon = () => {
        setFormData({
            ...formData,
            addons: [
                ...formData.addons,
                { type: '', description: '', price: '' }
            ]
        });
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData({ ...formData, addons: newAddons });
    };

    const handleRemoveAddon = (index) => {
        const newAddons = formData.addons.filter((_, i) => i !== index);
        setFormData({ ...formData, addons: newAddons });
    };

    return (
        <div className="adminFlights">
            <div className="admin-flights">
            <div className="header">
                <h1>Flight Management</h1>
                <button className="add-button" data-testid="add-flight-button" onClick={() => setShowModal(true)}>
                    Add New Flight
                </button>
            </div>

            <div className="flights-list">
                {flights.map(flight => (
                    <div key={flight._id} className="flight-card" data-testid={`flight-card-${flight._id}`}>
                        <div className="flight-info">
                            <h3 data-testid={`flight-title-${flight._id}`}>{flight.airline} - {flight.flightNumber}</h3>
                            <p>Route: {flight.departureAirport} → {flight.arrivalAirport}</p>
                            <p>Departure: {new Date(flight.departureTime).toLocaleString()}</p>
                            <p>Arrival: {new Date(flight.arrivalTime).toLocaleString()}</p>
                            <p>Price: RM{flight.price}</p>
                            <p>Available Seats: {flight.availableSeats}</p>
                            <p>Class: {flight.type}</p>
                        </div>
                        <div className="flight-actions">
                            <button data-testid={`edit-flight-${flight._id}`} onClick={() => handleEdit(flight)}>Edit</button>
                            <button data-testid={`delete-flight-${flight._id}`} onClick={() => handleDelete(flight._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2  data-testid="modal-title">{editingFlight ? 'Edit Flight' : 'Add New Flight'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Airline</label>
                                    <input
                                        type="text"
                                        name="airline"
                                        data-testid="airline-input"
                                        value={formData.airline}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Flight Number</label>
                                    <input
                                        type="text"
                                        name="flightNumber"
                                        data-testid="flight-number-input"
                                        value={formData.flightNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure Airport</label>
                                    <div className="autocomplete-container">
                                        <input
                                            type="text"
                                            value={departureSearch}
                                            onChange={(e) => handleSearch(e.target.value, 'departure')}
                                            placeholder="Search IATA code or city"
                                        />
                                        {departureSuggestions.length > 0 && (
                                            <ul className="suggestions-list">
                                                {departureSuggestions.map(code => (
                                                    <li
                                                        key={code._id}
                                                        onClick={() => handleSelectIATA(code, 'departure')}
                                                    >
                                                        {code.iataCode} - {code.city} ({code.airportName})
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Arrival Airport</label>
                                    <div className="autocomplete-container">
                                        <input
                                            type="text"
                                            value={arrivalSearch}
                                            onChange={(e) => handleSearch(e.target.value, 'arrival')}
                                            placeholder="Search IATA code or city"
                                        />
                                        {arrivalSuggestions.length > 0 && (
                                            <ul className="suggestions-list">
                                                {arrivalSuggestions.map(code => (
                                                    <li
                                                        key={code._id}
                                                        onClick={() => handleSelectIATA(code, 'arrival')}
                                                    >
                                                        {code.iataCode} - {code.city} ({code.airportName})
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure Time</label>
                                    <DatePicker
                                        selected={formData.departureTime}
                                        onChange={(date) => setFormData({...formData, departureTime: date})}
                                        showTimeSelect
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Arrival Time</label>
                                    <DatePicker
                                        selected={formData.arrivalTime}
                                        onChange={(date) => setFormData({...formData, arrivalTime: date})}
                                        showTimeSelect
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price (RM)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Available Seats</label>
                                    <input
                                        type="number"
                                        name="availableSeats"
                                        value={formData.availableSeats}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Class Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="Economy">Economy</option>
                                        <option value="Business">Business</option>
                                        <option value="First Class">First Class</option>
                                    </select>
                                </div>
                            </div>

                            <div className="addons-section">
                                <h3>Add-ons</h3>
                                <button className="btn" type="button" onClick={handleAddAddon}>Add Add-on</button>
                                {formData.addons.map((addon, index) => (
                                    <div key={index} className="addon-item">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Type</label>
                                                <input
                                                    type="text"
                                                    value={addon.type}
                                                    data-testid={`addon-type-${index}`}
                                                    onChange={(e) => handleAddonChange(index, 'type', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Description</label>
                                                <input
                                                    type="text"
                                                    value={addon.description}
                                                    data-testid={`addon-description-${index}`}
                                                    onChange={(e) => handleAddonChange(index, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Price (RM)</label>
                                                <input
                                                    type="number"
                                                    value={addon.price}
                                                    data-testid={`addon-price-${index}`}
                                                    onChange={(e) => handleAddonChange(index, 'price', e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                className="remove-addon"
                                                onClick={() => handleRemoveAddon(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions">
                                <button type="submit" data-testid="submit-flight-button">
                                    {editingFlight ? 'Update Flight' : 'Create Flight'}
                                </button>
                                <button type="button" data-testid="cancel-flight-button"  onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default AdminFlights;