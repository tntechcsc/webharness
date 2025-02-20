import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import placeholder from "../assets/profile-placeholder.png";

const Navbar = () => {
  const baseURL = window.location.origin;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const uri = `${baseURL}:3000/api/user/logout`;
      let session_id = sessionStorage.getItem("session_id");

      if (!session_id) {
        return;
      }
      const res = await fetch(`${baseURL}:3000/api/user/logout`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-session-id': session_id || '' },
      });
      const data = await res.json();
      sessionStorage.removeItem('session_id');
      window.location = '/login';
    } catch (err) {
      console.error(err.message);
    }
  };

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
        <Link to="/login" style={{ textDecoration: 'none' }} className="nav-button" onClick={handleLogout()}>Logout</Link>
      </div>
    </div>
  );
};

export default Navbar;