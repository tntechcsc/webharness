import React, { useState, useEffect } from 'react';
import '../App'; // Ensure your styles are linked correctly
import Navbar from "../components/Navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import placeholder from "../assets/profile-placeholder.png";
import Layout from "./Layout";
import PageHeader from "../components/PageHeader";



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
    <Layout title="Welcome to Project Mangrove">
      <div className="homepage-content">
        <h1>Welcome to Project Mangrove!</h1>
        <p>This application is a demonstration harness.  It is capable of handling the launch
          of different applications (e.g. java applications, AR/VR applications, python scripts,
          etc.), as well as having different user accounts with different roles.
        </p>
      </div>
    </Layout>
  );
};



export default HomePage;
