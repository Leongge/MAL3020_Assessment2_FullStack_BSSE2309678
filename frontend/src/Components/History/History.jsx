import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'
import SignIn from './SignIn';

const History = () => {
    const [bookings, setBookings] = useState([]);
    const [showSignIn, setShowSignIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkLoginAndFetchData();
    }, []);

    const checkLoginAndFetchData = async () => {
        const session = localStorage.getItem('userSession');
        if (!session) {
            setShowSignIn(true);
            setLoading(false);
            return;
        }

        try {

            const sessionData = JSON.parse(session);
            const userEmail = sessionData.email;
            // Fetch user data
            const userResponse = await fetch('http://localhost:3000/api/users');
            const users = await userResponse.json();
            const currentUser = users.find(user => user.email === userEmail);

            if (!currentUser) {
                setShowSignIn(true);
                setLoading(false);
                return;
            }

            // Fetch bookings
            const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
            const bookingsData = await bookingsResponse.json();
            
            // Filter bookings for current user
            const userBookings = bookingsData.bookings.filter(
                booking => booking.userId === currentUser._id
            );
            
            setBookings(userBookings);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        setShowSignIn(false);
        checkLoginAndFetchData();
    };

    const navigateToDetail = (booking) => {
        navigate(`/history/${booking._id}`, { state: { bookingData: booking } });
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="history">
            <div className="history-page">
            <h1>Booking History</h1>
            <div className="booking-cards">
                {bookings.map((booking) => (
                    <div 
                        key={booking._id} 
                        className="booking-card"
                        onClick={() => navigateToDetail(booking)}
                    >
                        <div className="booking-header">
                            <span>Booking ID: {booking._id}</span>
                            <span className="booking-status">{booking.status}</span>
                        </div>
                        {booking.flights.map((flight, index) => (
                            <div key={index} className="flight-info">
                                <div className="route">
                                    <span>{flight.departureLocation}</span>
                                    <span className="arrow">→</span>
                                    <span>{flight.arrivalLocation}</span>
                                </div>
                                <div className="datetime">
                                    <div>
                                        <label>Departure:</label>
                                        <span>{new Date(flight.departureDate).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <label>Arrival:</label>
                                        <span>{new Date(flight.arrivalDate).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="booking-footer">
                            <span>Total Price: RM {booking.totalPrice}</span>
                            <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showSignIn && (
                <SignIn 
                    onClose={() => setShowSignIn(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}
        </div>
        </div>
    );
};

export default History;