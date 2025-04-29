import React, { useState, useEffect } from "react";
import { useNavigate, useLocation  } from "react-router-dom";
import { checkSession } from "../utils/authUtils";
import { setHashLocation } from "../utils/utils.js"

// Protected route component
const ProtectedRoute = ({ element }) => {
    const navigate  = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(null); // are they authenticated? also can use this for admin pages too
  
    useEffect(() => {
      const validateSession = async () => {
        const isValid = await checkSession(); // check if their session is valid
        setIsAuthenticated(isValid); // if it is valid they are authenticated
      };
      
      validateSession();
    }, []);

    useEffect(() => {
      if (isAuthenticated == false) {
        navigate("login");
      }
    }, [isAuthenticated])
  
    if (isAuthenticated === null) {
      return <div>Loading...</div>; // Loading state while checking session
    }
  
    // If the user is not authenticated, redirect to login page
    if (isAuthenticated === false) {
      return null;
    }
  
    return element; // Show the protected element
  };

  export default ProtectedRoute;