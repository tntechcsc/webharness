import React, { useState, useEffect } from 'react';
import  ProtectedRoute  from "./components/ProtectedRoute"
import './App.css'; // Ensure your styles are linked correctly
import { BrowserRouter as Router, Route, Routes, useLocation  } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Application from "./pages/Application";
import RoleManagement from "./pages/RoleManagement";
import Navbar from "./components/Navbar";
import Login from "./pages/login";

function App() {
  const [atLogin, setAtLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation(); // Hook to get the current location/pathname
  // Simulate a delay before showing the page content
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Adjust timing as needed
  }, []);

  
  const applications = [
   
  ];


  return (
    <>
      {isLoading ? (
        <div className="loading-container">
          <img src='LogoHarness2.png' alt="Loading Logo" className="loading-logo" />
          <p className='loading-text'> Loading Project Mangrove </p>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="d-flex min-vh-100 bg-dark text-light">
          <div className="flex-grow-1">
            <Routes>
              <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
              <Route path="role-management" element={<ProtectedRoute element={<RoleManagement />} />} />
              <Route path="applications" element={<ProtectedRoute element={<Application />} />} />
              <Route path="login" element={<Login />} />
            </Routes>
          </div>
        </div>
      )}
    </>
  );
}

// Wrap the App component with the Router to provide routing context
export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
