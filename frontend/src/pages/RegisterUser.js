import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../RegisterUser.css"; // Ensure this CSS file exists

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Member"
  });

  // Handles input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to register user");

      alert("User registered successfully!");
      navigate("/role-management"); // Redirect back to Role Management
    } catch (err) {
      console.error("Error registering user:", err);
      alert("Failed to register user.");
    }
  };

  return (
    <div className="register-container">
      <h2>Register New User</h2>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Role:</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="Member">Member</option>
          <option value="Admin">Admin</option>
        </select>

        <button type="submit" className="submit-button">Register</button>
      </form>
    </div>
  );
};

export default RegisterUser;
