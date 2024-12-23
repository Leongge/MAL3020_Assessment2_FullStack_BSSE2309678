import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import QRCode from 'qrcode';
// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'
import SignIn from './SignIn';

const HistoryDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showSignIn, setShowSignIn] = useState(false);
    const [qrCodes, setQrCodes] = useState({});
    const { bookingData } = location.state || {};

    useEffect(() => {
        checkLoginStatus();
        if (bookingData) {
            generateAllQRCodes();
        }
    }, [bookingData]);

    const checkLoginStatus = () => {
        const session = localStorage.getItem('userSession');
        if (!session) {
            setShowSignIn(true);
            return;
        }
    };

    const handleLoginSuccess = () => {
        setShowSignIn(false);
    };

    const generateQRCode = async (data) => {
        try {
            return await QRCode.toDataURL(JSON.stringify(data));
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    };

    const generateAllQRCodes = async () => {
        const codes = {};
        
        if (bookingData.flights[0].mainPassengers[0]) {
            const mainPassengerData = {
                type: 'Main Passenger',
                name: bookingData.flights[0].mainPassengers[0].name,
                flightId: bookingData.flights[0].flightId,
                bookingRef: bookingData._id
            };
            codes.mainPassenger = await generateQRCode(mainPassengerData);
        }

        if (bookingData.additionalPassengers?.length > 0) {
            codes.additional = {};
            for (const [index, passenger] of bookingData.additionalPassengers.entries()) {
                const passengerData = {
                    type: 'Additional Passenger',
                    name: passenger.name,
                    flightId: bookingData.flights[0].flightId,
                    bookingRef: bookingData._id,
                    passengerNumber: index + 1
                };
                codes.additional[index] = await generateQRCode(passengerData);
            }
        }

        setQrCodes(codes);
    };

    if (!bookingData) {
        return <div className="loading">No booking data available</div>;
    }

    return (
        <div className="historyDetail">
            <div className="history-detail">
            <div className="booking-detail">
                <div className="detail-container">
                    <div className="header">
                        <div className="status-icon">
                            <Check size={40} color="white" />
                        </div>
                        <h1>Booking Details</h1>
                        <p className="booking-reference">
                            Booking Reference: {bookingData._id}
                        </p>
                        <p className="booking-status">
                            Status: {bookingData.status}
                        </p>
                    </div>

                    {bookingData.flights && Array.isArray(bookingData.flights) && 
                        bookingData.flights.map((flight, index) => (
                            <div key={index} className="flight-details-card">
                            <h2>{index === 0 ? 'Departure Flight' : 'Return Flight'}</h2>
                            <div className="flight-info">
                                <div className="flight-route">
                                <span className="airport">{flight.departureLocation}</span>
                                <span className="arrow">→</span>
                                <span className="airport">{flight.arrivalLocation}</span>
                                </div>
                                <div className="flight-times">
                                <div className="time-group">
                                    <label>Departure</label>
                                    <p>{new Date(flight.departureDate).toLocaleString()}</p>
                                </div>
                                <div className="time-group">
                                    <label>Arrival</label>
                                    <p>{new Date(flight.arrivalDate).toLocaleString()}</p>
                                </div>
                                </div>
                                <div className="flight-id">
                                <label>Flight ID</label>
                                <p>{flight.flightId}</p>
                                </div>
                            </div>
                            </div>
                        ))
                        }

                        <div className="passengers-section">
                        {/* Main Passenger */}
                        {bookingData.flights && bookingData.flights[0] && (
                            <div className="passenger-details-card">
                            <h2>Passenger Information</h2>
                            <div className="main-passenger">
                                <h3>Main Passenger</h3>
                                <div className="passenger-info">
                                <p><strong>Name:</strong> {bookingData.flights[0].mainPassengers[0].name}</p>
                                <p><strong>Email:</strong> {bookingData.flights[0].mainPassengers[0].email}</p>
                                <p><strong>Phone:</strong> {bookingData.flights[0].mainPassengers[0].phone}</p>
                                <p><strong>Identity No:</strong> {bookingData.flights[0].mainPassengers[0].IdentityNo}</p>
                                <p><strong>Address:</strong> {bookingData.flights[0].mainPassengers[0].Address}</p>
                                {/* QR Code for main passenger */}
                                {bookingData.flights[0].mainPassengers[0].qrCode && (
                                    <div className="qr-code">
                                    <p><strong>Boarding Pass QR Code:</strong></p>
                                    <img 
                                        src={qrCodes.mainPassenger} 
                                        alt="Main Passenger QR Code"
                                        className="qr-image"
                                    />
                                    </div>
                                )}
                                </div>
                            </div>

                            {/* Additional Passengers */}
                                {bookingData.additionalPassengers && bookingData.additionalPassengers.length > 0 && (
                                    <div className="additional-passengers">
                                    <h3>Additional Passengers</h3>
                                    {bookingData.additionalPassengers.map((passenger, index) => (
                                        <div key={index} className="passenger-info">
                                        <p><strong>Title & Name:</strong> {passenger.title} {passenger.name}</p>
                                        <p><strong>Nationality:</strong> {passenger.nationality}</p>
                                        <p><strong>Date of Birth:</strong> {new Date(passenger.dateOfBirth).toLocaleDateString()}</p>
                                        {passenger.qrCode && qrCodes.additional && qrCodes.additional[index] &&(
                                            <div className="qr-code">
                                            <p><strong>Boarding Pass QR Code:</strong></p>
                                            {qrCodes.additional && qrCodes.additional[index] ? (
                                                <img 
                                                    src={qrCodes.additional[index]} 
                                                    alt={`Passenger ${index + 1} QR Code`}
                                                    className="qr-image"
                                                />
                                                ) : (
                                                <p>Generating QR Code...</p>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                    ))}
                                    </div>
                                )}
                                </div>
                            )}
                            </div>

                        {/* Add-ons Section */}
                        {bookingData.addons && bookingData.addons.length > 0 && (
                        <div className="addons-card">
                            <h2>Selected Add-ons</h2>
                            <div className="addons-list">
                            {bookingData.addons.map((addon, index) => (
                                <div key={index} className="addon-item">
                                <span className="addon-type">{addon.type}</span>
                                <span className="addon-price">RM {addon.price}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                        )}

                        {/* Price Summary Section */}
                        <div className="price-summary-card">
                        <h2>Price Summary</h2>
                        <div className="total-price">
                            <span>Total Amount Paid</span>
                            <span className="price">RM {bookingData.totalPrice}</span>
                        </div>
                        </div>
                    
                    <div className="action-buttons">
                        <button onClick={() => window.print()} className="print-button">
                            Print Details
                        </button>
                        <button onClick={() => navigate('/history')} className="back-button">
                            Back to History
                        </button>
                    </div>
                </div>
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

export default HistoryDetail;