import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, TextField, MenuItem, Button, Typography, CircularProgress } from "@mui/material";
import Select from "react-select";

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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    const user_id = await fetchUserId();
    if (!user_id) {
      setStatusMessage("Failed to retrieve user session.");
      setLoading(false);
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
        setStatusMessage("Application added successfully!");
        setLoading(false);
        navigate("/applications");
      } else {
        setStatusMessage(responseData.message || "Failed to add application.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("An error occurred while adding the application.");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 5, padding: 3, backgroundColor: "#fff", borderRadius: "8px", boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom>Add Application</Typography>
        
        {statusMessage && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {statusMessage}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Application Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Application Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Executable Path"
            name="executable_path"
            value={formData.executable_path}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Arguments (Optional)"
            name="arguments"
            value={formData.arguments}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Team/Individual Responsible"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>Categories:</Typography>
          <Select
            isMulti
            options={categories}
            value={selectedCategories}
            onChange={handleCategoryChange}
            placeholder="Select categories"
            className="custom-react-select"
            classNamePrefix="custom"
            styles={{
              container: (provided) => ({
                ...provided,
                marginBottom: "16px",
              }),
              option: (provided, state) => ({
                ...provided,
                color: "#808080", // Darker text color for options
              }),
            }}
          />

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ py: 1.5, mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Add Application"}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default AddApplication;
