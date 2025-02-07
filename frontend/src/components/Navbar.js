import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';  

const Navbar = () => {
  return (
    <div className="navbar">
      {/* Sidebar/Navbar */}
      <div className="sidebar">
        <div className="logo-button">
          <Link to="/" style={{ all: 'unset', cursor: 'pointer' }}>
            <img 
              src="LogoHarness2.png" 
              alt="Logo" 
              style={{ width: '10rem', height: '11rem'}} 
            />
          </Link>
        </div>
        <Link to="/applications" style={{ textDecoration: 'none' }} className="nav-button">Application</Link>
        <Link to="/role-management" style={{ textDecoration: 'none' }} className="nav-button">Role Management</Link>
      </div>
    </div>
  );
};

export default Navbar;