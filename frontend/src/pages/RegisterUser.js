import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, TextField, Button, Typography, CircularProgress, IconButton } from "@mui/material";
import { FaPlus } from "react-icons/fa";
import Select from "react-select";
import { useTheme } from "@mui/material/styles";
import getReactSelectStyles from "./../reactSelectStyles"; // Import the styles


const baseURL = window.location.origin;

const RegisterUser = () => {
  const theme = useTheme();

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
      <Box sx={{ mt: 5, padding: 3, backgroundColor: theme.palette.background.paper, textColor: theme.palette.text.primary, borderRadius: "8px", boxShadow: 3 }}>
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
            styles={getReactSelectStyles(theme)}
          />

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ py: 1.5, mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : <IconButton><FaPlus /></IconButton>}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default RegisterUser;
