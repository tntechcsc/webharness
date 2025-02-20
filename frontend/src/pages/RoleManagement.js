import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import "bootstrap/dist/css/bootstrap.min.css";
import bootstrap from "bootstrap";
import { Link } from "react-router-dom"; // ✅ Import Link for navigation
import '../RoleManagement.css'; // Ensure CSS file exists

const RoleManagement = () => {
  // ✅ Mock Data (Used if backend is down)
  const mockUsers = [
    { id: 1, name: "Tommy", role: "Member", email: "tommy@example.com" },
    { id: 2, name: "Hunter", role: "Admin", email: "hunter@example.com" },
    { id: 3, name: "Jesus", role: "Member", email: "jesus@example.com" },
    { id: 4, name: "Nate", role: "Member", email: "nate@example.com" },
    { id: 5, name: "Burchfield", role: "SuperAdmin", email: "burchfield@example.com" }
  ];

  const [users, setUsers] = useState(mockUsers); // ✅ Default to mock data
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const baseURL = window.location.origin;


  // ✅ Fetch users from backend, replacing mock data if successful
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let session_id = sessionStorage.getItem("session_id");
        let uri = `${baseURL}:3000/api/users/all`
        const response = await fetch(uri, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": session_id || "",
          }
        });

        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data); // ✅ Replace mock data with backend data
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Using mock data (backend unavailable).");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ✅ Update user role
  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    console.log(`Updated role for user ${userId} to ${newRole}`);
  };

  // ✅ Delete user
  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    console.log(`Deleted user with ID: ${userId}`);
  };

  // ✅ Reset password
  const handleResetPassword = (userId) => {
    alert(`Password reset for user ID: ${userId}`);
  };

  return (
    <Layout title="Role Management">
    <div className="role-management d-flex flex-column w-full align-items-center justify-content-center">
      
      <input
        type="text"
        placeholder="Search users..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? <p>Loading users...</p> : (
        <>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <label>
                      <input type="radio" name={`role-${user.id}`} value="Member" checked={user.role === "Member"} onChange={() => handleRoleChange(user.id, "Member")} />
                      Member
                    </label>
                    <label>
                      <input type="radio" name={`role-${user.id}`} value="Admin" checked={user.role === "Admin"} onChange={() => handleRoleChange(user.id, "Admin")} />
                      Admin
                    </label>
                  </td>
                  <td>
                    <button className="reset-button" onClick={() => handleResetPassword(user.id)}>Reset Password</button>
                    <button className="delete-button" onClick={() => handleDeleteUser(user.id)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ Register User Button */}
          <div className="button-container">
            <Link to="/register-user" className="register-button text-decoration-none">
              Register User
            </Link>
          </div>
        </>
      )}
    </div>
    </Layout>
  );
};

export default RoleManagement;
