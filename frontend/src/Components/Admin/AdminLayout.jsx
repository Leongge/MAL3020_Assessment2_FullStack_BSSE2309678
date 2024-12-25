import React from 'react';
import { useNavigate } from 'react-router-dom';
// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/');
  };

  return (
    <div className="admin">
        <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <button 
            className="admin-nav-item"
            onClick={() => navigate('/admin/flights')}
          >
            Manage Flights
          </button>
          <button 
            className="admin-nav-item"
            onClick={() => navigate('/admin/airports')}
          >
            Manage Airports
          </button>
        </nav>
        <button className="admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
    </div>
  );
};

export default AdminLayout;