import React, { useState, useEffect, useRef } from "react";
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
  TableSortLabel
} from "@mui/material";
import { FaPlay, FaEye, FaPlus, FaStop } from "react-icons/fa";
import { useTheme } from "@mui/material/styles";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const baseURL = window.location.origin;

function Application() {
  const [applications, setApplications] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [runningApplications, setRunningApplications] = useState({});
  const theme = useTheme();
  const wsRef = useRef({});

  useEffect(() => {
    fetchApplications();

    // Load previous running applications from localStorage
    let savedRunningApps = JSON.parse(localStorage.getItem("runningApplications")) || {};

    // Ensure we only process valid appId → processId mappings
    const validRunningApps = {};
    Object.entries(savedRunningApps).forEach(([appId, pid]) => {
      if (appId && pid) {
        validRunningApps[appId] = pid;
        //Attempt to reconnect to WebSocket for each running application
        connectWebSocket(pid, appId);
      } else {
        // Log and ignore invalid entries
        console.warn(`Invalid stored process found (appId: ${appId}, PID: ${pid}) - Ignoring.`);
      }
    });

    setRunningApplications(validRunningApps);
    localStorage.setItem("runningApplications", JSON.stringify(validRunningApps));

    console.log("Application.js has loaded successfully!");

    return () => {
      // Cleanup before unmounting
      window.removeEventListener("beforeunload", saveActiveProcesses);
    };
  }, []);

  // Save active processes before page refresh
  const saveActiveProcesses = () => {
    const activeProcesses = {};
    Object.entries(wsRef.current).forEach(([pid, ws]) => {
      if (ws.appId) {
        activeProcesses[ws.appId] = pid;
      }
    });
    localStorage.setItem("runningApplications", JSON.stringify(activeProcesses));
  };
  window.addEventListener("beforeunload", saveActiveProcesses);

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

  const runApplication = async (appId, appName) => {
    setStatusMessage("Starting application...");

    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        console.error("No session ID found in sessionStorage.");
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
        const data = await response.json();
        const processId = data.process_id;

        withReactContent(Swal).fire({
          title: <i>Success</i>,
          text: appName + " has been started successfully!",
          icon: "success",
        });
        
        setRunningApplications(prev => {
          const updated = { ...prev, [appId]: processId };
          // Save updated running applications to localStorage
          localStorage.setItem("runningApplications", JSON.stringify(updated));
          return updated;
        });
        setRunningApplications(prev => ({ ...prev, [appId]: true }));
        setStatusMessage("");
        connectWebSocket(processId, appId);
      } else {
        const errorData = await response.json();
        withReactContent(Swal).fire({
          title: <i>Failure</i>,
          text: appName + " failed to start.",
          icon: "error",
        });
      }
    } catch (error) {
      withReactContent(Swal).fire({
        title: <i>Failure</i>,
        text: appName + " failed to start.",
        icon: "error",
      });
    }
  };

  const stopApplication = async (appId, appName) => {
    setStatusMessage("Stopping application...");

    try {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        console.error("No session ID found in sessionStorage.");
        return;
      }

      const response = await fetch(`${baseURL}:3000/api/process/${appId}/stop`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
      });

      if (response.ok) {
        withReactContent(Swal).fire({
          title: <i>Success</i>,
          text: appName + " has been stopped successfully!",
          icon: "success",
        });

        setRunningApplications(prev => {
          const updated = { ...prev };
          delete updated[appId];
          localStorage.setItem("runningApplications", JSON.stringify(updated));
          return updated;
        });

        setStatusMessage("");
      } else {
        const errorData = await response.json();
        withReactContent(Swal).fire({
          title: <i>Failure</i>,
          text: appName + " failed to stop." + errorData.message,
          icon: "error",
        });
      }
    } catch (error) {
      withReactContent(Swal).fire({
        title: <i>Failure</i>,
        text: appName + " failed to stop.",
        icon: "error",
      });
    }
  };

  const connectWebSocket = (processId, appId) => {
    if (!processId || !appId) {
      console.warn(`Skipping WebSocket connection due to invalid processId or appId (PID: ${processId}, App ID: ${appId})`);
      return;
    }
  
    if (wsRef.current[processId]) {
      console.warn(`WebSocket for process ${processId} already exists. Skipping.`);
      return;
    }
  
    // Establish WebSocket connection
    const wsUrl = `ws://${window.location.hostname}:3000/ws/process/${processId}`;
    const ws = new WebSocket(wsUrl);
  
    ws.appId = appId;
    wsRef.current[processId] = ws;
  
    ws.onmessage = (event) => {
      if (event.data === "Stopped") {
        // Update state to mark the application as inactive
        setRunningApplications(prev => {
          const updated = { ...prev };
          delete updated[appId]; // Remove app from running state
          localStorage.setItem("runningApplications", JSON.stringify(updated));
          return updated;
        });
  
        // Close WebSocket connection & clean up
        if (wsRef.current[processId]) {
          wsRef.current[processId].close();
          delete wsRef.current[processId];
        }
      }
    };
  
    ws.onerror = (event) => {
  
      // Assume 404 means the process is already stopped
      setRunningApplications(prev => {
        const updated = { ...prev };
        delete updated[appId]; // Remove from state
        localStorage.setItem("runningApplications", JSON.stringify(updated));
        return updated;
      });
  
      // Ensure WebSocket is cleaned up
      if (wsRef.current[processId]) {
        wsRef.current[processId].close();
        delete wsRef.current[processId];
      }
    };
  
    ws.onclose = (event) => {
      console.log(`🔌 WebSocket connection closed for process ${processId} (Code: ${event.code}, Reason: ${event.reason})`);
  
      // If closed with a 404 response, assume stopped
      if (event.code === 1006) { // 1006 indicates abnormal closure (e.g., failed to establish connection)
        // Update state to mark the application as inactive
        setRunningApplications(prev => {
          const updated = { ...prev };
          delete updated[appId];
          localStorage.setItem("runningApplications", JSON.stringify(updated));
          return updated;
        });
      }
  
      delete wsRef.current[processId];
    };
  };
  
  const filteredApplications = applications.filter((app) =>
    app.application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.application.categories.some((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    (app.application.contact && app.application.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.application.description && app.application.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleChangePage = (event, newPage) => { //used to handle pagination of our table -> sets the new page to be shown
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => { //handles change of amount of rows per page
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => { //handles the sorting of tables
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  //const orderBy = 'categories';
  //const order = 'desc';
  const sortedApplications = filteredApplications.sort((a, b) => { // array of sorted applications
    if (orderBy === 'name') {
      return order === 'asc'
        ? a.application.name.localeCompare(b.application.name)
        : b.application.name.localeCompare(a.application.name);
    } else if (orderBy === 'categories') {
      const aCategories = a.application.categories.map(cat => cat.name).join(", ");
      const bCategories = b.application.categories.map(cat => cat.name).join(", ");
      return order === 'asc'
        ? aCategories.localeCompare(bCategories)
        : bCategories.localeCompare(aCategories);
    } else if (orderBy === 'contact') {
      return order === 'asc'
        ? (a.application.contact || "").localeCompare(b.application.contact || "")
        : (b.application.contact || "").localeCompare(a.application.contact || "");
    } else if (orderBy === 'description') {
      return order === 'asc'
        ? (a.application.description || "").localeCompare(b.application.description || "")
        : (b.application.description || "").localeCompare(a.application.description || "");
    } else if (orderBy === 'status') {
      return order === 'asc'
        ? (a.application.status || "Inactive").localeCompare(b.application.status || "Inactive")
        : (b.application.status || "Inactive").localeCompare(a.application.status || "Inactive");
    }
    return 0;
  });

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}> {/* Boilter plate for our page content*/}
      <Navbar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />

        <Container sx={{ mt: 5, ml: 2, maxWidth: "xl" }}> {/* Effectively our main content page */}
          {statusMessage && <Typography variant="body1" sx={{ mb: 2 }}>{statusMessage}</Typography>} {/*TODO replace with swal or something */}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box id="applications-overview" sx={{ p: 3, backgroundColor: theme.palette.background.paper, textColor: theme.palette.text.primary, borderRadius: "8px" }}>
                <Typography variant="h6">Applications Overview</Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Button id="add-application-button" variant="contained" component={Link} to="/add-application" style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                    <IconButton variant="contained" color="primary" style={{ color: '#12255f' }}>
                      <FaPlus />
                    </IconButton>
                  </Button> {/*Buton to add new application */}
                  <TextField
                    id="search-bar"
                    label="Search applications..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Box>

                <TableContainer component={Paper}>{/*our table container that holds our info. paper is mui effect to make the page look like paper */}
                  <Table> {/*Our table definition */}
                    <TableHead>{/*our table header */}
                      <TableRow>
                        <TableCell>{/*our label sorting logic */}
                          <TableSortLabel 
                            active={orderBy === 'name'}
                            direction={orderBy === 'name' ? order : 'asc'}
                            onClick={() => handleRequestSort('name')}
                          >
                            Application Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'categories'}
                            direction={orderBy === 'categories' ? order : 'asc'}
                            onClick={() => handleRequestSort('categories')}
                          >
                            Categories
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'contact'}
                            direction={orderBy === 'contact' ? order : 'asc'}
                            onClick={() => handleRequestSort('contact')}
                          >
                            Contact
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'description'}
                            direction={orderBy === 'description' ? order : 'asc'}
                            onClick={() => handleRequestSort('description')}
                          >
                            Description
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'status'}
                            direction={orderBy === 'status' ? order : 'asc'}
                            onClick={() => handleRequestSort('status')}
                          >
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>{/*Table body*/}
                      {sortedApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => ( //further filters our sorted array to only show the rows we want which are determined by the page and rows per page
                        <TableRow key={row.application.id}>
                          <TableCell>{row.application.name}</TableCell>
                          <TableCell>{row.application.categories.map((cat) => cat.name).join(", ") || "N/A"}</TableCell>
                          <TableCell>{row.application.contact || "N/A"}</TableCell>
                          <TableCell>{row.application.description}</TableCell>
                          <TableCell>{runningApplications[row.application.id] ? "Active" : "Inactive"}</TableCell>
                          <TableCell sx={{ display: "", justifyContent: "" }}>
                            {runningApplications[row.application.id] ? (
                              <Button id={index === 0 ? "stop-button" : undefined} variant="contained" color="error" onClick={() => stopApplication(row.application.id, row.application.name)} title="Stop" size="small" style={{ backgroundColor: '#ea7575', padding: '2px 0px', transform: "scale(0.75)" }}>
                                <IconButton variant="contained" color="primary" style={{ color: '#12255f' }}>
                                  <FaStop />
                                </IconButton>
                              </Button>
                            ) : (
                              <Button id={index === 0 ? "run-button" : undefined} variant="contained" color="success" onClick={() => runApplication(row.application.id, row.application.name)} title="Run" size="small" style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                                <IconButton variant="contained" color="primary" style={{ color: '#12255f' }}>
                                  <FaPlay />
                                </IconButton>
                              </Button>
                            )}
                            <Button id={index === 0 ? "view-button" : undefined} variant="contained" color="success" component={Link} to={`/view-application/${row.application.id}`} size="small" title="View" style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                              <IconButton variant="contained" color="primary"  style={{ color: '#12255f' }}>
                                <FaEye />
                              </IconButton>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination //table pagination logic
                    rowsPerPageOptions={[5, 10, 25]} //options for rows per page
                    component="div" //type of component it is
                    count={filteredApplications.length} //how long it should be
                    rowsPerPage={rowsPerPage} //# of rows per page
                    page={page} //current page
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
