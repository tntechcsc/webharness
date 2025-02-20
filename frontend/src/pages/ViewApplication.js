import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./ViewApplication.css"; // Import CSS

const baseURL = window.location.origin;

const ViewApplication = () => {
  const { id } = useParams(); // Get application ID from URL
  const [application, setApplication] = useState(null);
  const [instructions, setInstructions] = useState({ path: "", arguments: "" }); // Ensure it's always an object
  const [statusMessage, setStatusMessage] = useState("Loading application details...");

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        setStatusMessage("Unauthorized: No session ID found.");
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/applications/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setStatusMessage("Application not found.");
        } else {
          setStatusMessage("Failed to fetch application details.");
        }
        return;
      }

      const data = await response.json();

      setApplication(data.application);
      setInstructions(data.instructions || { path: "", arguments: "" }); // Ensure it always has a structure

      setStatusMessage("");
    } catch (error) {
      console.error("Error fetching application:", error);
      setStatusMessage("Error fetching application details.");
    }
  };

  const runApplication = async () => {
    setStatusMessage("Starting application...");

    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        setStatusMessage("Session ID is missing. Please log in.");
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
        body: JSON.stringify({ application_id: application.id }), // Send application ID
      });

      if (response.ok) {
        setStatusMessage("Application started successfully.");
      } else {
        const errorData = await response.json();
        setStatusMessage(`Failed to start application: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    }
  };

  const removeApplication = async () => {
    setStatusMessage("Removing application...");

    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(`${baseURL}:3000/api/applications/remove/${id}`, {
        method: "DELETE",
        headers: { "x-session-id": session_id },
      });

      if (response.ok) {
        setStatusMessage("Application removed successfully.");
        window.location.href = "/applications";
      } else {
        setStatusMessage("Failed to remove application.");
      }
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    }
  };

  if (!application) {
    return <h2 className="error-message">{statusMessage || "Loading..."}</h2>;
  }

  return (
    <div className="view-app-container">
      <h2 className="app-title">{application.name}</h2>

      <table className="app-details-table">
        <tbody>
          <tr>
            <td><strong>Application Description:</strong></td>
            <td>{application.description}</td>
          </tr>
          <tr>
            <td><strong>Application Categories:</strong></td>
            <td>
              {application.categories && application.categories.length > 0
                ? application.categories.map((cat) => cat.name).join(", ")
                : "None"}
            </td>
          </tr>
          <tr>
            <td><strong>Executable Path:</strong></td>
            <td className="file-url">{instructions.path || "No path provided"}</td>
          </tr>
          <tr>
            <td><strong>Arguments:</strong></td>
            <td>{instructions.arguments || "None"}</td>
          </tr>
          <tr>
            <td><strong>Contact:</strong></td>
            <td>{application.contact || "Not provided"}</td>
          </tr>
        </tbody>
      </table>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      <div className="button-group">
        <button className="remove-button" onClick={removeApplication}>Remove Application</button>
        <button className="run-button" onClick={runApplication} disabled={!instructions.path}>
          Run Application
        </button>
      </div>

      <Link to="/applications" className="back-button">← Back to Applications</Link>
    </div>
  );
};

export default ViewApplication;
