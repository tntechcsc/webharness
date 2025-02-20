import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import placeholder from "../assets/profile-placeholder.png";

const Navbar = () => {
  return (
    <div className="navbar">
      {/* Sidebar/Navbar */}
      <div className="sidebar">
        <div className="logo-button">
        <Link to="/profile" style={{ textDecoration: 'none' }} className="nav-button">
            <img
              src={placeholder}
              alt="Profile"
              className="rounded-circle border"
              width="75"
              height="75"
            />
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }} className="nav-button">
            <img 
              src="LogoHarness2.png" 
              alt="Logo" 
              style={{ width: '8 rem', height: '10rem'}} 
            />
          </Link>
        </div>
        <Link to="/applications" style={{ textDecoration: 'none' }} className="nav-button">Application</Link>
        <Link to="/role-management" style={{ textDecoration: 'none' }} className="nav-button">Role Management</Link>
        <Link to="/login" style={{ textDecoration: 'none' }} className="nav-button" onClick={() => {sessionStorage.removeItem("session_id");}}>Logout</Link>
      </div>
    </div>
  );
};

export default Navbar;