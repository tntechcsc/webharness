import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./AddApplication.css"; // Import CSS

const baseURL = window.location.origin;

const AddApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    executable_path: "",
    arguments: "",
    contact: "",
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(`${baseURL}:3000/api/categories`, {
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id
        }
      });

      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.categories)) {
        setCategories(data.categories.map(cat => ({ value: cat.id, label: cat.name })));
      } else {
        throw new Error("Invalid categories data");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch current user ID
  const fetchUserId = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        console.error("No session ID found in sessionStorage.");
        return null;
      }

      const response = await fetch(`${baseURL}:3000/api/user/info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id
        }
      });

      if (!response.ok) throw new Error("Failed to get user session");

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle category selection using react-select
  const handleCategoryChange = (selectedOptions) => {
    setSelectedCategories(selectedOptions || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("Submitting...");

    const user_id = await fetchUserId();
    if (!user_id) {
      setStatusMessage("Failed to retrieve user session.");
      return;
    }

    const applicationData = {
      ...formData,
      user_id,
      category_ids: selectedCategories.map(option => option.value),
    };

    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(`${baseURL}:3000/api/applications/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id
        },
        body: JSON.stringify(applicationData),
      });

      const responseData = await response.json();
      if (response.ok) {
        alert("Application added successfully!");
        navigate("/applications");
      } else {
        setStatusMessage(responseData.message || "Failed to add application.");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("An error occurred while adding the application.");
    }
  };

  return (
    <div className="add-app-container">
      <h2 className="add-app-header">Add Application</h2>
      {statusMessage && <p className="status-message">{statusMessage}</p>}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <label>Application Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <label>Application Description:</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required />

          <label>Executable Path:</label>
          <input type="text" name="executable_path" value={formData.executable_path} onChange={handleChange} required />

          <label>Arguments (Optional):</label>
          <input type="text" name="arguments" value={formData.arguments} onChange={handleChange} />

          <label>Team/Individual Responsible:</label>
          <input type="text" name="contact" value={formData.contact} onChange={handleChange} required />

          <label>Categories:</label>
          <div className="category-select">
            <Select
              isMulti
              options={categories}
              value={selectedCategories}
              onChange={handleCategoryChange}
              placeholder="Select categories"
              className="custom-react-select"
              classNamePrefix="custom"
            />
          </div>

          <button type="submit" className="submit-button">
            Add Application
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddApplication;
