import React from "react";

// Function to check if the session is valid
export const checkSession = async () => {
    const sessionId = sessionStorage.getItem('session_id'); // Get the session ID from sessionStorage
  
    if (!sessionId) {
      return false; // If no session ID, user is not authenticated
    }
  
    try {
      const response = await fetch('https://localhost:3000/session_validate_api', {
        method: 'GET',
        headers: {
          'x-session-id': `${sessionId}`, // Pass session ID as a Bearer token in the Authorization header
        },
        credentials: 'include', // Optional, if you need to include cookies for session management
      });
  
      if (response.status === 200) {
        return true; // session valid
      } else if (response.status === 401) {
        return false; // Unauthorized, session invalid
      }
    } catch (error) {
      console.error("Error during session validation:", error);
      return false; // In case of an error, consider user unauthorized
    }
    return false;
  };