// React and related library imports
import React, { useState, useEffect } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";

// MUI components for styling and layout
import { Box, Container, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Button, CircularProgress, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Icons used in the UI
import { IoReturnDownBackSharp, IoTrashBinOutline } from "react-icons/io5";
import { FaPlay, FaEye, FaPlus  } from "react-icons/fa";
import Swal from 'sweetalert2';

// SweetAlert for alert dialogs
import withReactContent from 'sweetalert2-react-content';
import { LuClipboardPenLine } from "react-icons/lu";


// Get the origin of the current window (base URL)
const baseURL = "http://localhost";

// Main component
const ViewApplication = () => {

  // State variables
  const theme = useTheme();
  const { id } = useParams(); // Get application ID from URL
  const [application, setApplication] = useState(null);
  const [instructions, setInstructions] = useState({ path: "", arguments: "" });
  const [statusMessage, setStatusMessage] = useState("Loading application details...");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

// Run fetch when component mounts
  useEffect(() => {
    fetchApplication();
    console.log(id) // For debugging: logs the application ID
  }, []);

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


      // Handle different HTTP status codes
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
      setApplication(data.application);
      setInstructions(data.instructions || { path: "", arguments: "" });
      setStatusMessage("");
    } catch (error) {
      console.error("Error fetching application:", error);
      setStatusMessage("Error fetching application details.");
    }
    setLoading(false);
  };


   // Function to handle starting an application
  const runApplication = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        setStatusMessage("Session ID is missing. Please log in.");
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
        body: JSON.stringify({ application_id: application.id }),
      });


       // Show success alert
      if (response.ok) {
        withReactContent(Swal).fire({
          title: <i>Success</i>,
          text: application.name + " has been started successfully!",
          icon: "success",
        })
        // Show failure alert
      } else {
        withReactContent(Swal).fire({
          title: <i>Failure</i>,
          text: application.name + " failed to start.",
          icon: "error",
        })
      }
    } catch (error) {
      // Show fallback failure alert
      withReactContent(Swal).fire({
        title: <i>Failure</i>,
        text: application.name + " failed to start.",
        icon: "error",
      })
    }
  };
// Function to delete application from the backend
  const removeApplication = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(`${baseURL}:3000/api/applications/remove/${id}`, {
        method: "DELETE",
        headers: { "x-session-id": session_id },
      });

      if (response.ok) {
        withReactContent(Swal).fire({
          title: <i>Success</i>,
          text: application.name + " has been deleted successfully!",
          icon: "success",
           // Redirect to application list after deletion
        }).then(() => {           
          navigate("/applications");
        });
      } else {
        withReactContent(Swal).fire({
          title: <i>Failure</i>,
          text: "Failed to delete " + application.name,
          icon: "error",
        })
      }
    } catch (error) {
      withReactContent(Swal).fire({
        title: <i>Failure</i>,
        text: "Failed to delete " + application.name,
        icon: "error",
      })
    }
  };
   // Trigger confirmation modal before deletion
  const handleRemoveClick = async () => {
    withReactContent(Swal).fire({
      title: <i>Warning</i>,
      text: "Are you sure you want to delete " + application.name + "?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        removeApplication();            // Proceed if confirmed
      }
    });
  }
 // Show loading spinner while data is being fetched
  if (loading) {
    return <CircularProgress />;
  }
  
  // Show error message if no application found
  if (!application) {
    return <Typography variant="h6" color="error">{statusMessage || "Loading..."}</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5, padding: 3, backgroundColor: theme.palette.background.paper, textColor: theme.palette.text.primary, borderRadius: "8px", boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom >{application.name}</Typography>

        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell ><strong>Application Description:</strong></TableCell>
                <TableCell >{application.description}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell ><strong>Application Categories:</strong></TableCell>
                <TableCell >
                  {application.categories && application.categories.length > 0
                    ? application.categories.map((cat) => cat.name).join(", ")
                    : "None"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell ><strong>Executable Path:</strong></TableCell>
                <TableCell >{instructions.path || "No path provided"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell ><strong>Arguments:</strong></TableCell>
                <TableCell >{instructions.arguments || "None"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell ><strong>Contact:</strong></TableCell>
                <TableCell >{application.contact || "Not provided"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {statusMessage && <Typography variant="body2" color="error" sx={{ mt: 2 }}>{statusMessage}</Typography>}

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="error" onClick={handleRemoveClick} sx={{ mr: 2 }}>
            <IconButton><IoTrashBinOutline /></IconButton>
          </Button>
          <Button
            sx={{ mr: 2 }}
            variant="contained"
            color="error"
            onClick={runApplication}
            disabled={!instructions.path}
          >
            <IconButton><FaPlay /></IconButton>
          </Button>
          <RouterLink to={`/edit-application/`+id}>
            <Button
              variant="contained"
              color="error"
              disabled={!instructions.path}
            >
              <IconButton><LuClipboardPenLine /></IconButton>
            </Button>
          </RouterLink>

        </Box>
        

        <Box sx={{ mt: 3 }}>
          <RouterLink to="/applications">
            <Button variant="text" color="secondary">
              <IconButton><IoReturnDownBackSharp /></IconButton>
            </Button>
          </RouterLink>
        </Box>

      </Box>
    </Container>
  );
};

export default ViewApplication;
