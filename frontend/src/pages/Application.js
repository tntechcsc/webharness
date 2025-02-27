import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Button, Typography, Divider, Grid } from "@mui/material";
import { FaPlay, FaEye } from "react-icons/fa";
import { useTheme } from "@mui/material/styles";
import DataTable from "react-data-table-component"; // Import DataTable
import "bootstrap/dist/css/bootstrap.min.css";


const baseURL = window.location.origin;

function Application() {
  console.log("Application.js has loaded successfully!"); // Debug Log

  const [applications, setApplications] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const theme = useTheme();

  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch applications (with category names included from the backend)
  const fetchApplications = async () => {
    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        console.error("No session ID found in sessionStorage.");
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/applications`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch applications");

      const data = await response.json();
      setApplications(data.applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setStatusMessage("Using mock data (backend unavailable).");
    }
  };

  // Run an application
  const runApplication = async (appId) => {
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
        body: JSON.stringify({ application_id: appId }),
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

  // Filter applications based on search input
  const filteredApplications = applications.filter((app) =>
    app.application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.application.categories.some((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    (app.application.contact && app.application.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.application.description && app.application.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Define columns for DataTable
  const columns = [
    {
      name: "Application Name",
      selector: (row) => row.application.name,
      sortable: true,
    },
    {
      name: "Categories",
      selector: (row) =>
        row.application.categories.length > 0
          ? row.application.categories.map((cat) => cat.name).join(", ")
          : "N/A",
      sortable: true,
    },
    {
      name: "Contact",
      selector: (row) => row.application.contact || "N/A",
      sortable: true,
    },
    {
      name: "Description",
      selector: (row) => row.application.description,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.application.status || "Inactive",
      sortable: true,
      cell: (row) => (
        <div className={`status ${row.application.status?.toLowerCase() || "inactive"}`}>
          {row.application.status || "Inactive"}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="button-group">
          <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
            <button
              className="run-button"
              onClick={() => runApplication(row.application.id)}
              title="Run"
            >
              <FaPlay />
            </button>
            <Link
              to={`/view-application/${row.application.id}`}
              className="view-button"
              title="View"
            >
              <FaEye />
            </Link>
          </Container>
        </div>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden", backgroundColor: theme.palette.background.default }}>
      <Navbar /> {/* Vertical navbar */}

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar /> {/* Horizontal navbar */}

        <Container sx={{ mt: 5, ml: 2, maxWidth: "xl" }}>
          {statusMessage && <Typography variant="body1" sx={{ mb: 2 }}>{statusMessage}</Typography>}

          <Grid container spacing={3}>
            {/* The applications table */}
            <Grid item xs={12}>
              <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "8px" }}>
                <Typography variant="h6">Applications Overview</Typography>
                <Divider sx={{ my: 2 }} />

                {/* Search bar and Add Application button */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Button variant="contained" className="ms-4" component={Link} to="/add-application">+ Add Application</Button>
                </Box>

                {/* DataTable for applications */}
                <Container> {/* So the borderRadius above doesnt apply duh */}
                  <DataTable
                    columns={columns}
                    data={filteredApplications}
                    pagination
                    highlightOnHover
                    responsive
                    subHeader
                    subHeaderComponent={
                      <input
                        type="text"
                        placeholder="Search applications..."
                        className="searchbar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: "10px", width: "100%" }}
                      />
                    }
                  />
                </Container>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Application;
