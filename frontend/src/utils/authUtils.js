import React from "react";
import { useNavigate } from "react-router-dom";

// Function to check if the session is valid
export const checkSession = async () => {
    const sessionId = sessionStorage.getItem('session_id'); // Get the session ID from sessionStorage

    const baseURL = "http://localhost";
  
    if (!sessionId) {
      return false; // If no session ID, user is not authenticated
    }
  
    try {
      const response = await fetch(`${baseURL}:3000/api/session-validate`, {
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

export const HandleLogout = async () => {
    const baseURL = "http://localhost";

    try {
      let session_id = sessionStorage.getItem('session_id');
      if (!session_id) {
        console.error('No session ID found in sessionStorage.');
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/user/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('session_id')
        }
      });
  
      if (response.ok) {
        //sessionStorage.removeItem('session_id');
        //navigate("/login");
        return true;
      }
      else {
        //alert("ERROR"); -> edge case is if someone else logs in with same credentials, then this user is "logged out" but the log out request above fails because their session isnt found
        return false;
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  
  
}

export const fetchRole = async () => {
  const baseURL = "http://localhost";
  let session_id = sessionStorage.getItem("session_id");
  if (!session_id) {
    return;
  }

  try {
    const response = await fetch(`${baseURL}:3000/api/user/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": session_id || "",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch profile");

    const user = await response.json();
    return user.roleName;
  } catch (error) {
    console.error("Error fetching profile:", error);
  } finally {
  }
};