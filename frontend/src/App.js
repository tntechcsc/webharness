import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure your styles are linked correctly
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Application from "./pages/Application";
import RoleManagment from "./pages/RoleManagement";
import Navbar from "./components/Navbar";


function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate a delay before showing the page content
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Adjust timing as needed
  }, []);

  
  const applications = [
   
  ];

  // Filter applications based on search input
  const filteredApps = applications.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {isLoading ? (
        <div className="loading-container">
          <img src='LogoHarness2.png' alt="Loading Logo" className="loading-logo" />
          <p className='loading-text'> Loading Project Mangrove </p>
          <div className="spinner"></div>
        </div>
      ) : (
        <Router>
        <div className="d-flex min-vh-100 bg-dark text-light">
          <Navbar />
          <div className="flex-grow-1">
            <Routes>
            <Route path="/" element={<Home />} />
            </Routes>
          </div>
        </div>
    </Router>
      )}
    </>
  );
}

export default App;
