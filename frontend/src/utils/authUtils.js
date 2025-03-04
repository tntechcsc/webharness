import React from "react";

// Use an environment variable for flexibility
const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

// Function to check if the session is valid
export const checkSession = async () => {
    const sessionId = sessionStorage.getItem('session_id'); // Get the session ID from sessionStorage

    if (!sessionId) {
        return false; // If no session ID, user is not authenticated
    }

    try {
        const response = await fetch(`${baseURL}/api/session-validate`, {
            method: 'GET',
            headers: {
                'x-session-id': sessionId, // Pass session ID in the header
            },
            credentials: 'include', // Optional, if session requires cookies
        });

        if (response.status === 200) {
            return true; // Session is valid
        } else if (response.status === 401) {
            return false; // Unauthorized, session is invalid
        }
    } catch (error) {
        console.error("Error during session validation:", error);
        return false; // In case of an error, consider user unauthorized
    }

    return false;
};
