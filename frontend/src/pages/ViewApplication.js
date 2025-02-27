import React, { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Container, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Button, CircularProgress } from "@mui/material";

const baseURL = window.location.origin;

const ViewApplication = () => {
  const { id } = useParams(); // Get application ID from URL
  const [application, setApplication] = useState(null);
  const [instructions, setInstructions] = useState({ path: "", arguments: "" });
  const [statusMessage, setStatusMessage] = useState("Loading application details...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplication();
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

  const runApplication = async () => {
    setStatusMessage("Starting application...");
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

      if (response.ok) {
        setStatusMessage("Application started successfully.");
      } else {
        const errorData = await response.json();
        setStatusMessage(`Failed to start application: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    }
  };

  const removeApplication = async () => {
    setStatusMessage("Removing application...");
    try {
      let session_id = sessionStorage.getItem("session_id");
      const response = await fetch(`${baseURL}:3000/api/applications/remove/${id}`, {
        method: "DELETE",
        headers: { "x-session-id": session_id },
      });

      if (response.ok) {
        setStatusMessage("Application removed successfully.");
        window.location.href = "/applications";
      } else {
        setStatusMessage("Failed to remove application.");
      }
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!application) {
    return <Typography variant="h6" color="error">{statusMessage || "Loading..."}</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5, padding: 3, backgroundColor: "#fff", borderRadius: "8px", boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom>{application.name}</Typography>

        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell><strong>Application Description:</strong></TableCell>
                <TableCell>{application.description}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Application Categories:</strong></TableCell>
                <TableCell>
                  {application.categories && application.categories.length > 0
                    ? application.categories.map((cat) => cat.name).join(", ")
                    : "None"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Executable Path:</strong></TableCell>
                <TableCell>{instructions.path || "No path provided"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Arguments:</strong></TableCell>
                <TableCell>{instructions.arguments || "None"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Contact:</strong></TableCell>
                <TableCell>{application.contact || "Not provided"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {statusMessage && <Typography variant="body2" color="error" sx={{ mt: 2 }}>{statusMessage}</Typography>}

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="error" onClick={removeApplication} sx={{ mr: 2 }}>
            Remove Application
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={runApplication}
            disabled={!instructions.path}
          >
            Run Application
          </Button>
        </Box>

        <Box sx={{ mt: 3 }}>
          <RouterLink to="/applications">
            <Button variant="outlined" color="secondary">
              ← Back to Applications
            </Button>
          </RouterLink>
        </Box>
      </Box>
    </Container>
  );
};

export default ViewApplication;
