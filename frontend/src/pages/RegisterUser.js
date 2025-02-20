import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../RegisterUser.css"; // Ensure this CSS file exists
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "password123",
    role: "3",
    username: "",
  });
  const baseURL = window.location.origin;


  // Handles input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const uri = `${baseURL}:3000/api/user/register`;
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id || "",
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("User registered successfully!");
        navigate("/role-management");
      }
      else throw new Error("Failed to register user");
    } catch (err) {
      console.error("Error registering user:", err);
      alert("Failed to register user.");
    }
  };

  return (
    <div className="register-container">
      <div className="d-flex align-items-center justify-content-between">
        <h2>Register New User</h2>
        <Button className="btn btn-danger p-2" onClick={() => {navigate("/role-management")}}>
          <span style={{ color: "black", fontSize: "18px" }}>✕</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Role:</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="3">Viewer</option>
          <option value="2">Admin</option>
        </select>

        <button type="submit" className="submit-button">Register</button>
      </form>
    </div>
  );
};

export default RegisterUser;
