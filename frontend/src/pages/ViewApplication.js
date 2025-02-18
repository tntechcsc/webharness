import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./ViewApplication.css"; // Import CSS

const ViewApplication = () => {
  const { id } = useParams(); // Get application ID from URL
  const [statusMessage, setStatusMessage] = useState(""); // Status message

  // Mock application data (Replace with API fetch if needed)
  const applications = [
    { 
      id: 1, 
      name: "Caves of Qud", 
      description: "A roguelike adventure", 
      type: "Desktop", 
      url: "D:/Games/Caves of Qud/CoQ.exe", 
      responsible: "Indie Dev Team", 
      status: "Active" 
    },
    { 
      id: 2, 
      name: "Test App", 
      description: "Test Web Application", 
      type: "Web", 
      url: "C:/Program Files/TestApp/test.exe", 
      responsible: "QA Team", 
      status: "Inactive" 
    }
  ];

  // Find the application by ID
  const application = applications.find(app => app.id === parseInt(id));

  if (!application) {
    return <h2 className="error-message">Application not found</h2>;
  }

  // ✅ Function to Run Application (Mock API Request)
  const runApplication = async () => {
    setStatusMessage("Starting application...");

    try {
      const response = await fetch("http://localhost:3000/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: application.url })
      });

      if (response.ok) {
        setStatusMessage("Application started successfully.");
      } else {
        setStatusMessage("Failed to start application.");
      }
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    }
  };

  // ✅ Function to Remove Application (Mock API Request)
  const removeApplication = async () => {
    setStatusMessage("Removing application...");

    try {
      const response = await fetch(`http://localhost:3000/api/remove/${application.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setStatusMessage("Application removed successfully.");
        // Redirect back to applications list after removal
        window.location.href = "/applications";
      } else {
        setStatusMessage("Failed to remove application.");
      }
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    }
  };

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
            <td><strong>Application Type:</strong></td>
            <td>{application.type}</td>
          </tr>
          <tr>
            <td><strong>Application URL:</strong></td>
            <td className="file-url">{application.url}</td>
          </tr>
          <tr>
            <td><strong>Team/Individual Responsible:</strong></td>
            <td>{application.responsible}</td>
          </tr>
          <tr>
            <td><strong>Application Status:</strong></td>
            <td className={`status ${application.status.toLowerCase()}`}>{application.status}</td>
          </tr>
        </tbody>
      </table>

      {/* Status Message */}
      {statusMessage && <p className="status-message">{statusMessage}</p>}

      {/* Buttons for Run & Remove */}
      <div className="button-group">
        <button className="remove-button" onClick={removeApplication}>Remove Application</button>
        <button className="run-button" onClick={runApplication}>Run Application</button>
      </div>

      <Link to="/applications" className="back-button">← Back to Applications</Link>
    </div>
  );
};

export default ViewApplication;
