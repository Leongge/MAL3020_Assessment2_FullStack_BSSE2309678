import React from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./Components/Navbar/Navbar"
import Home from "./Components/Home/Home"
import Search from "./Components/Search/Search"
import Support from "./Components/Support/Support"
import Info from "./Components/Info/Info"
import Lounge from "./Components/Lounge/Lounge"
import Travelers from "./Components/Travelers/Travelers"
import Subscribers from "./Components/Subscribers/Subscribers"
import Footer from "./Components/Footer/Footer"
import Flights from "./Components/Flights/Flights"
import SignUp from "./Components/SignUp/Signup" 
import Booking from "./Components/Flights/Booking"
import Confirmation from "./Components/Flights/Confirmation"
import History from "./Components/History/History"
import HistoryDetail from "./Components/History/HistoryDetail"
import AdminLayout from "./Components/Admin/AdminLayout"
import AdminFlights from "./Components/Admin/AdminFlights"
import AdminAirports from "./Components/Admin/AdminAirports"

const AppContent = () => {
  const location = useLocation(); // Get the current path
  
  // Determine if Navbar and Footer should be hidden
  const hideNavbarFooter = location.pathname === "/confirmation" || 
  location.pathname.startsWith("/history/") ||
  location.pathname.startsWith("/admin/");

  return (
    <div>
      {!hideNavbarFooter && <Navbar />}
      <Routes>
        <Route path="/" element={
          <>
            <Home />
            <Support />
            <Info />
            <Lounge />
            <Travelers />
            <Footer />
          </>
        } />

        <Route path="/flights" element={
          <>
            <Flights />
            <Footer />
          </>
        } />

        <Route path="/signup" element={
          <>
            <SignUp />
            <Footer />
          </>
        } />
        <Route path="/booking" element={
          <>
            <Booking />
            <Footer />
          </>
        } />
        <Route path="/history" element={
          <>
            <History />
            <Footer />
          </>
        } />
        <Route path="/history/:bookingId" element={<HistoryDetail />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/admin/flights" element={
          <AdminLayout>
            <AdminFlights />
          </AdminLayout>
        } />
        <Route path="/admin/airports" element={
          <AdminLayout>
            <AdminAirports />
          </AdminLayout>
        } />
      </Routes>
      {!hideNavbarFooter}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
