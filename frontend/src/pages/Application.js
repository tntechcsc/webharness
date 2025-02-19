import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from "./Layout";
import '../Application.css';

function Application() {
  console.log("Application.js has loaded successfully!");  // Debug Log

  const [applications, setApplications] = useState([
    { id: 1, name: "Caves of Qud", type: "Desktop", description: "A roguelike adventure", status: "Active", path: "D:/Games/Caves of Qud/CoQ.exe" },
    { id: 2, name: "Test App", type: "Web", description: "Test Web Application", status: "Inactive", path: "C:/Program Files/TestApp/test.exe" },
    { id: 3, name: "Photo Editor", type: "Desktop", description: "Advanced image editing software", status: "Active", path: "C:/Programs/PhotoEditor/photo.exe" }
  ]);

  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/applications"); //switch all this to origin based routing
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setStatusMessage("Using mock data (backend unavailable).");
      }
    };

    fetchApplications();
  }, []);

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

  const filteredApplications = applications.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                      <button className="run-button" onClick={() => runApplication(app.path)}>
                        Run
                      </button>
                      <Link to={`/view-application/${app.id}`} className="view-button">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
        <div className="button-container">
          <Link to="/add-application" className="add-app-button">+ Add Application</Link>
        </div>
      </div>
    </Layout>
  );
}

export default Application;
