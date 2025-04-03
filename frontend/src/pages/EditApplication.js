import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Box, Container, TextField, MenuItem, Button, Typography, CircularProgress, Paper, IconButton } from "@mui/material";
import { RiEditLine } from "react-icons/ri";
import { IoReturnDownBackSharp } from "react-icons/io5";
import Select from "react-select";
import { useTheme } from "@mui/material/styles";
import getReactSelectStyles from "../reactSelectStyles"; // Import the styles
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


const baseURL = window.location.origin;

const EditApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get application ID from URL
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
  
  const theme = useTheme();

  useEffect(() => {
    fetchCategories();
    fetchApplication();
  }, [id]);

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

  const fetchApplication = async () => {
    setLoading(true);
    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        setStatusMessage("Unauthorized: No session ID found.");
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/applications/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setStatusMessage("Application not found.");
        } else {
          setStatusMessage("Failed to fetch application details.");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setFormData({
        name: data.application.name,
        description: data.application.description,
        executable_path: data.instructions.path,
        arguments: data.instructions.arguments,
        contact: data.application.contact
      });
      setSelectedCategories(data.application.categories.map(cat => ({ value: cat.id, label: cat.name })));
    } catch (error) {
      console.error("Error fetching application:", error);
      setStatusMessage("Error fetching application details.");
    }
    setLoading(false);
  };

  // Fetch current user ID // shoulnt be required technically as we should use session id from sessionguard to work. as it is now, someone could theoretically use someone elses user id to add an application
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

  //TODO: Have this hit the update application endpoint instead, and change the edit application endpoint to take in categories
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      id,
      //category_ids: selectedCategories.map(option => option.value),
    };

    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(`${baseURL}:3000/api/applications/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id
        },
        body: JSON.stringify(applicationData),
      });

      const responseData = await response.json();
      if (response.ok) {
        setLoading(false);
        withReactContent(Swal).fire({
          title: <i>Success</i>,
          text: formData.name + " has been added!",
          icon: "success",
        }).then(() => navigate(-1));
      } else {
        withReactContent(Swal).fire({
          title: <i>Failure</i>,
          text: formData.name + " could not be added!",
          icon: "error",
        })
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      withReactContent(Swal).fire({
        title: <i>Failure</i>,
        text: formData.name + " could not be added!",
        icon: "error",
      })
      setLoading(false);
    }
  };

  //sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "8px" }}
  return (
    <Container maxWidth="sm">
      <Box component={Paper} sx={{ mt: 5, padding: 3, backgroundColor: theme.palette.background.paper, textColor: theme.palette.text.primary, borderRadius: "8px", boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom sx={{textColor: theme.palette.text.primary}}>Edit Application</Typography>
        
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
            placeholder="C:\Windows\system32\notepad.exe"
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
            {loading ? <CircularProgress size={24} /> : <IconButton><RiEditLine /></IconButton>}
          </Button>
        </form>
        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" color="secondary" onClick={() => {navigate(-1)}}>
            <IconButton><IoReturnDownBackSharp /></IconButton>
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default EditApplication;
