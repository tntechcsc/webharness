import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import placeholder from "../assets/profile-placeholder.png";


const Navbar = () => {
  const handleLogout = async () => {
    try {
      let session_id = sessionStorage.getItem('session_id');
      if (!session_id) {
        console.error('No session ID found in sessionStorage.');
        return;
      }

      const response = await fetch(`${window.location.origin}:3000/api/user/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('session_id')
        }
      });
      sessionStorage.removeItem('session_id');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  return (
    <div className="navbar">
      {/* Sidebar/Navbar */}
      <div className="sidebar">
        <div className="logo-button">
        <div style={{ textDecoration: 'none' }} className="nav-button">
            <img
              src={placeholder}
              alt="Profile"
              className="rounded-circle border"
              width="75"
              height="75"
              onClick={() => window.location.href = "/profile"}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div style={{ textDecoration: 'none' }} className="nav-button">
            <img 
              src="LogoHarness2.png" 
              alt="Logo" 
              style={{ width: '8 rem', height: '10rem'}} 
              onClick={() => window.location.href = "/"}
            />
          </div>
        </div>
        <div style={{ textDecoration: 'none' }} className="nav-button" onClick={() => window.location.href = "/Applications"}>Application</div>
        <div to="/role-management" style={{ textDecoration: 'none' }} className="nav-button" onClick={() => window.location.href = "/role-management"}>Role Management</div>
        <Link to="/login" style={{ textDecoration: 'none' }} className="nav-button" onClick={() => {handleLogout()}}>Logout</Link>
      </div>
    </div>
  );
};

export default Navbar;