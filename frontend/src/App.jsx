import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
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

const App = () => {
  return(
    <Router>  
      <div>
        <Navbar/>
        <Routes>
          <Route path="/" element={
            <>
              <Home/>
              <Search/>
              <Support/>
              <Info/>
              <Lounge/>
              <Travelers/>
              <Subscribers/>
              <Footer/>
            </>
          } />
          
          <Route path="/flights" element={
            <>
              <Flights/>
              <Footer/>
            </>
          } />

          <Route path="/signup" element={
            <>
              <SignUp/>
              <Footer/>
            </>
          } />
          <Route path="/booking" element={  
            <>
              <Booking/>
              <Footer/>
            </>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App

//15:00