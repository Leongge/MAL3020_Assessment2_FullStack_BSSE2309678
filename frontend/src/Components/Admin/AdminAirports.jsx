import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import AOS =====>
import Aos from "aos"
import 'aos/dist/aos.css'

const AdminAirports = () => {
  const [iataCodes, setIataCodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    iataCode: '',
    airportName: '',
    city: '',
    country: ''
  });

  // Fetch IATA codes
  const fetchIataCodes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/iata-codes');
      setIataCodes(response.data);
    } catch (error) {
      console.error('Error fetching IATA codes:', error);
      alert('Failed to fetch IATA codes');
    }
  };

  useEffect(() => {
    fetchIataCodes();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Open modal for creating/editing
  const handleOpenModal = (iataData = null) => {  
    if (iataData) {
      console.log(iataData);
      console.log(iataData._id);
      setEditingId(iataData._id);
      setFormData({
        iataCode: iataData.iataCode,
        airportName: iataData.airportName,
        city: iataData.city,
        country: iataData.country
      });
    } else {
      setEditingId(null);
      setFormData({
        iataCode: '',
        airportName: '',
        city: '',
        country: ''
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/api/iata-codes/${editingId}`, formData);
      } else {
        await axios.post('http://localhost:3000/api/iata-codes', formData);
      }
      setShowModal(false);
      fetchIataCodes();
    } catch (error) {
      console.error('Error saving IATA code:', error);
      alert('Failed to save IATA code');
    }
  };

  // Handle deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this IATA code?')) {
      try {
        await axios.delete(`http://localhost:3000/api/iata-codes/${id}`);
        fetchIataCodes();
      } catch (error) {
        console.error('Error deleting IATA code:', error);
        alert('Failed to delete IATA code');
      }
    }
  };

  return (
    <div className="adminAirports">
        <div className="admin-flights">
      <h1>Manage IATA Codes</h1>
      
      <button className="btn btn-add" onClick={() => handleOpenModal()}>
        Add New IATA Code
      </button>

      <table className="flights-table">
        <thead>
          <tr>
            <th>IATA Code</th>
            <th>Airport Name</th>
            <th>City</th>
            <th>Country</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {iataCodes.map((iata) => (
            <tr key={iata._id}>
              <td>{iata.iataCode}</td>
              <td>{iata.airportName}</td>
              <td>{iata.city}</td>
              <td>{iata.country}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn btn-edit"
                    onClick={() => handleOpenModal(iata)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-delete"
                    onClick={() => handleDelete(iata._id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingId ? 'Edit IATA Code' : 'Add New IATA Code'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>IATA Code</label>
                <input
                  type="text"
                  name="iataCode"
                  value={formData.iataCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Airport Name</label>
                <input
                  type="text"
                  name="airportName"
                  value={formData.airportName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-delete"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-add">
                  {editingId ? 'Update' : 'Add'}
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

export default AdminAirports;