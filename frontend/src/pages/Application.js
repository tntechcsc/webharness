import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import "../Application.css";

function Application() {
  console.log("Application.js has loaded successfully!"); // Debug Log

  const [applications, setApplications] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch applications from the backend
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        let session_id = sessionStorage.getItem("session_id");
        if (!session_id) {
          console.error("No session ID found in sessionStorage.");
          return;
        }
    
        const response = await fetch(`http://localhost:3000/api/applications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": session_id
          }
        });
    
        if (!response.ok) throw new Error("Failed to fetch applications");
    
        const data = await response.json();
        setApplications(data.applications); // Update to use "applications" from the response
      } catch (error) {
        console.error("Error fetching applications:", error);
        setStatusMessage("Using mock data (backend unavailable).");
      }
    };    

    fetchApplications();
  }, []);

  // Run an application
  const runApplication = async (appPath) => {
    setStatusMessage("Running...");

    try {
      const response = await fetch(`${window.origin}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: appPath }),
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

  // Filter applications based on search input
  const filteredApplications = applications.filter((app) =>
    app.application.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Applications">
      <div className="application-container">
        {statusMessage && <p className="status-message">{statusMessage}</p>}

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search applications..."
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Applications Table */}
        <div className="app-table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>Application Name</th>
                <th>Type (Categories)</th>
                <th>Contact</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.application.id}>
                  <td>{app.application.name}</td>
                  <td>{app.application.category_ids.join(", ")}</td> {/* Updated to use category_ids */}
                  <td>{app.application.contact}</td>
                  <td>{app.application.description}</td>
                  <td className={`status ${app.application.status?.toLowerCase() || "inactive"}`}>
                    {app.application.status || "Inactive"}
                  </td>
                  <td>
                    <div className="button-group">
                      <button className="run-button" onClick={() => runApplication(app.instructions.path)}>
                        Run
                      </button>
                      <Link to={`/view-application/${app.application.id}`} className="view-button">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Application Button */}
        <div className="button-container">
          <Link to="/add-application" className="add-app-button">
            + Add Application
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default Application;
