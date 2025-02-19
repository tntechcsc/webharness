import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddApplication.css"; // Import CSS

const AddApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    url: "",
    responsible: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Application added successfully!");
        navigate("/applications");
      } else {
        alert("Failed to add application.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="add-app-container">
      <h2 className="add-app-header">Add Application</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <label>Application Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <label>Application Description:</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required />

          <label>Application Type:</label>
          <input type="text" name="type" value={formData.type} onChange={handleChange} required />

          <label>Application URL:</label>
          <input type="text" name="url" value={formData.url} onChange={handleChange} required />

          <label>Team/Individual Responsible:</label>
          <input type="text" name="responsible" value={formData.responsible} onChange={handleChange} required />

          <button type="submit" className="submit-button">Add Application</button>
        </form>
      </div>
    </div>
  );
};

export default AddApplication;
