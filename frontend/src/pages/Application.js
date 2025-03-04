import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import {
  Box,
  Container,
  Button,
  Typography,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  TablePagination,
} from "@mui/material";
import { FaPlay, FaEye } from "react-icons/fa";
import { useTheme } from "@mui/material/styles";

const baseURL = window.location.origin;

function Application() {
  console.log("Application.js has loaded successfully!");

  const [applications, setApplications] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();

  useEffect(() => {
    fetchApplications();
  }, []);

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
      setStatusMessage("Using mock data (backend unavailable). ");
    }
  };

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

  const filteredApplications = applications.filter((app) =>
    app.application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.application.categories.some((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    (app.application.contact && app.application.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.application.description && app.application.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <Navbar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <Container sx={{ mt: 5, ml: 2, maxWidth: "xl" }}>
          {statusMessage && <Typography variant="body1" sx={{ mb: 2 }}>{statusMessage}</Typography>}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "8px" }}>
                <Typography variant="h6">Applications Overview</Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Button variant="contained" component={Link} to="/add-application">+ Add Application</Button>
                  <TextField
                    label="Search applications..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Application Name</TableCell>
                        <TableCell>Categories</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                        <TableRow key={row.application.id}>
                          <TableCell>{row.application.name}</TableCell>
                          <TableCell>{row.application.categories.map((cat) => cat.name).join(", ") || "N/A"}</TableCell>
                          <TableCell>{row.application.contact || "N/A"}</TableCell>
                          <TableCell>{row.application.description}</TableCell>
                          <TableCell>{row.application.status || "Inactive"}</TableCell>
                          <TableCell>
                            <IconButton onClick={() => runApplication(row.application.id)} title="Run">
                              <FaPlay />
                            </IconButton>
                            <IconButton component={Link} to={`/view-application/${row.application.id}`} title="View">
                              <FaEye />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredApplications.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableContainer>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Application;
