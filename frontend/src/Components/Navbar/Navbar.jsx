import React, { useState } from 'react'
import { Link } from "react-router-dom";
import { CgMenuGridO } from 'react-icons/cg'
import logo from '../../assets/logo.png'
import SignIn from './SignIn';

const Navbar = () => {
  // NavBar menu state
  const [active, setActive] = useState('navBarMenu')
  const showNavBar = () => {
    setActive('navBarMenu showNavBar')
  }

  const removeNavBar = () => {
    setActive('navBarMenu')
  }

  // Background color state
  const [noBg, addBg] = useState('navBarTwo')
  const addBgColor = () => {
    if(window.scrollY >= 10){
      addBg('navBarTwo navbar_With_Bg')
    }else{
      addBg('navBarTwo')
    }
  }
  window.addEventListener('scroll', addBgColor)

  // SignIn popup state
  const [showSignIn, setShowSignIn] = useState(false);

  const handleSignInOpen = () => {
    setShowSignIn(true);
  }

  const handleSignInClose = () => {
    setShowSignIn(false);
  }

  const handleRegisterRedirect = () => {
    setShowSignIn(false);
    // Navigate to registration page
    // You might use react-router's useNavigate hook here
  }

  return (
    <>
      <div className='navBar flex'>
        <div className={noBg}>
          <div className="logoDiv">
            <img src={logo} className='logo' alt="Logo"/>
          </div>

          <div className={active}>
            <ul className="menu flex">
              <li onClick={removeNavBar} className="listItem"><Link to="/">Home</Link></li>
              <li onClick={removeNavBar} className="listItem"><Link to="/flights">Flight</Link></li>
              <li onClick={removeNavBar} className="listItem"><Link to="/history">History</Link></li>
              <li onClick={removeNavBar} className="listItem">Seats</li>
              <li onClick={removeNavBar} className="listItem"><Link to="/signup">Sign Up</Link></li>
            </ul> 

            <button onClick={removeNavBar} className="btn flex btnOne">
              Contact
            </button>
          </div>
          <button 
            onClick={handleSignInOpen} 
            className="btn flex btnTwo"
          >
            Sign In
          </button>
          <div onClick={showNavBar} className="toggleIcon">
            <CgMenuGridO className='icon'/>
          </div>
        </div>
      </div>

      {/* Conditionally render SignIn popup */}
      {showSignIn && (
        <SignIn 
          onClose={handleSignInClose} 
          onRegister={handleRegisterRedirect} 
        />
      )}
    </>
  )
}

export default Navbar