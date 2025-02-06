import React, { useState } from 'react';
import '../Application.css';

function Application() {
  const [applications] = useState([
    { id: 1, name: "App A", type: "Web", description: "A web application", status: "Active" },
    { id: 2, name: "App B", type: "Mobile", description: "A mobile app", status: "Inactive" },
    { id: 3, name: "App C", type: "Desktop", description: "A desktop app", status: "Active" }
  ]);

  return (
    <div className="application-container">
      <h2 className="app-header">Application</h2>
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
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.name}</td>
                <td>{app.type}</td>
                <td>{app.description}</td>
                <td className={`status ${app.status.toLowerCase()}`}>{app.status}</td>
                <td>
                  <button className="view-button">View</button>
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
