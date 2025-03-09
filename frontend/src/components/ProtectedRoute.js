import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { checkSession } from "../utils/authUtils"

// Protected route component
const ProtectedRoute = ({ element }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // are they authenticated? also can use this for admin pages too
  
    useEffect(() => {
      const validateSession = async () => {
        const isValid = await checkSession(); // check if their session is valid
        setIsAuthenticated(isValid); // if it is valid they are authenticated
      };
  
      validateSession();
    }, []);
  
    if (isAuthenticated === null) {
      return <div>Loading...</div>; // Loading state while checking session
    }
  
    // If the user is not authenticated, redirect to login page
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
  
    return element; // Show the protected element
  };

  export default ProtectedRoute;