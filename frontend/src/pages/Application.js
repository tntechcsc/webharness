import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import "../Application.css";

function Application() {
  console.log("Application.js has loaded successfully!"); // Debug Log

  const [applications, setApplications] = useState([]);
  const [categories, setCategories] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchApplications();
  }, []);

  // Fetch categories and store them in a dictionary for easy lookup. TODO: There is probably a better way of handling this
  const fetchCategories = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch("http://localhost:3000/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.categories)) {
        const categoryMap = {};
        data.categories.forEach((category) => {
          categoryMap[category.id] = category.name;
        });
        setCategories(categoryMap);
      } else {
        throw new Error("Invalid categories data");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        console.error("No session ID found in sessionStorage.");
        return;
      }

      const response = await fetch("http://localhost:3000/api/applications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch applications");

      const data = await response.json();
      setApplications(data.applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setStatusMessage("Using mock data (backend unavailable).");
    }
  };

  // Run an application
  const runApplication = async (appId) => {
    setStatusMessage("Starting application...");

    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        setStatusMessage("Session ID is missing. Please log in.");
        return;
      }

      const response = await fetch("http://localhost:3000/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
        body: JSON.stringify({ application_id: appId }), // Send application ID
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
                <th>Categories</th>
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
                  <td>
                    {app.application.category_ids
                      ?.map((id) => categories[id] || id) // Replace UUID with name
                      .join(", ") || "N/A"}
                  </td>
                  <td>{app.application.contact || "N/A"}</td>
                  <td>{app.application.description}</td>
                  <td className={`status ${app.application.status?.toLowerCase() || "inactive"}`}>
                    {app.application.status || "Inactive"}
                  </td>
                  <td>
                    <div className="button-group">
                      <button className="run-button" onClick={() => runApplication(app.application.id)}>
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
