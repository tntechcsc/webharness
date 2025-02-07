import React, { useState, useEffect } from 'react';
import '../App'; // Ensure your styles are linked correctly
import Navbar from "../components/Navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import placeholder from "../assets/profile-placeholder.png";



const HomePage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [userRole, setUserRole] = useState("superadmin");
  
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
  <div>
      <div className="app-container">
          {/* Main content area */}
          <div className="main-content">
            <div className="content-wrapper">
              <h1 className="page-header">Welcome to Project Mangrove</h1>
              <div className="profile-container">
                <div className="username-container">
                  <span className="username">John Doe</span>
                  <div className="role-subheader">
                    {userRole === "superadmin" ? "Super Admin" : "Admin"}
                  </div>
                </div>  
                <img src={placeholder} alt="Profile" className="profile-pic" />
              </div>

              {/* Mini Panel with Search and Application List */}
              <div className="mini-panel">
                <h2>Application Panel</h2>
                
                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="Search Feature"
                  className="search-bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Application Table */}
                <table className="app-table">
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.id}>
                        <td className="app-name">{app.name}</td>
                        <td>
                          <button className="run-button">Run</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
  </div> );
};



export default HomePage;
