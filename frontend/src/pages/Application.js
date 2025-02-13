import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Application.css';

function Application() {
  console.log("Application.js has loaded successfully!");  // Debug Log

  // ✅ Add the application list here
  const [applications] = useState([
    { id: 1, name: "Caves of Qud", type: "Desktop", description: "A roguelike adventure", status: "Active", path: "D:/Games/Caves of Qud/CoQ.exe" },
    { id: 2, name: "Test App", type: "Web", description: "Test Web Application", status: "Inactive", path: "C:/Program Files/TestApp/test.exe" }
  ]);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const runApplication = async (appPath) => {
    setStatusMessage("Running...");

    try {
      const response = await fetch("http://localhost:3000/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: appPath })
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
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="application-container">
      <h2 className="app-header">Application</h2>
      {statusMessage && <p className="status-message">{statusMessage}</p>}
      
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search applications..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="app-table-container">
        <table className="app-table">
          <thead>
            <tr>
              <th>Application Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((app) => (
              <tr key={app.id}>
                <td>{app.name}</td>
                <td>{app.type}</td>
                <td>{app.description}</td>
                <td className={`status ${app.status.toLowerCase()}`}>{app.status}</td>
                <td>
                  <div className="button-group">
                    <button className="view-button" onClick={() => runApplication(app.path)}>
                      Run
                    </button>
                    <Link to={`/view-application/${app.id}`} className="view-button" style={{ textDecoration: 'none' }}>
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Application;
