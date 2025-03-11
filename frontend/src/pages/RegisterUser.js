import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, TextField, Button, Typography, CircularProgress } from "@mui/material";
import Select from "react-select";

const baseURL = window.location.origin;

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "3", // default to "Viewer"
    password: "password123", // default password
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("Submitting...");
    setLoading(true);

    try {
      const uri = `${baseURL}:3000/api/user/register`;
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id || "",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatusMessage("User registered successfully!");
        setLoading(false);
        navigate("/role-management");
      } else {
        const data = await response.json();
        setStatusMessage(data.message || "Failed to register user.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setStatusMessage("An error occurred while registering the user.");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 5, padding: 3, backgroundColor: "#fff", borderRadius: "8px", boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom>Register New User</Typography>

        {statusMessage && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {statusMessage}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Role:</Typography>
          <Select
            options={[
              { value: "3", label: "Viewer" },
              { value: "2", label: "Admin" },
            ]}
            value={{ value: formData.role, label: formData.role === "3" ? "Viewer" : "Admin" }}
            onChange={(selectedOption) => setFormData({ ...formData, role: selectedOption.value })}
            placeholder="Select role"
            className="custom-react-select"
            classNamePrefix="custom"
            styles={{
              container: (provided) => ({
                ...provided,
                marginBottom: "16px",
              }),
              control: (provided) => ({
                ...provided,
                borderRadius: "4px",
                borderColor: "#ccc", // Default border color
                '&:hover': {
                  borderColor: "#1976d2", // Highlight border on hover
                },
              }),
              option: (provided, state) => ({
                ...provided,
                color: state.isSelected ? "#fff" : "#000", // White text when selected
                backgroundColor: state.isSelected ? "#1976d2" : "transparent", // Default MUI blue background when selected
                '&:hover': {
                  backgroundColor: state.isSelected ? "#1976d2" : "#f5f5f5", // Light grey background when hovering over non-selected option
                },
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "#1976d2", // Color of the selected value (matches MUI default blue)
              }),
              dropdownIndicator: (provided) => ({
                ...provided,
                color: "#1976d2", // Dropdown indicator color
                '&:hover': {
                  color: "#1976d2", // Maintain color when hovering
                },
              }),
              indicatorSeparator: (provided) => ({
                ...provided,
                backgroundColor: "#1976d2", // Separator color
              }),
              menu: (provided) => ({
                ...provided,
                borderRadius: "4px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Optional: Add some shadow for better visibility
              }),
              placeholder: (provided) => ({
                ...provided,
                color: "#808080", // Placeholder text color
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
            {loading ? <CircularProgress size={24} /> : "Register"}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default RegisterUser;
