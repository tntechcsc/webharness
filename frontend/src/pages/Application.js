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
  TableSortLabel
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
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
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
              <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "8px" }}>
                <Typography variant="h6">Applications Overview</Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Button variant="contained" component={Link} to="/add-application">+ Add Application</Button> {/*Buton to add new application */}
                  <TextField
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
                      {sortedApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => ( //further filters our sorted array to only show the rows we want which are determined by the page and rows per page
                        <TableRow key={row.application.id}>
                          <TableCell>{row.application.name}</TableCell>
                          <TableCell>{row.application.categories.map((cat) => cat.name).join(", ") || "N/A"}</TableCell>
                          <TableCell>{row.application.contact || "N/A"}</TableCell>
                          <TableCell>{row.application.description}</TableCell>
                          <TableCell>{row.application.status || "Inactive"}</TableCell>
                          <TableCell>
                          <Button variant="contained" color="success" onClick={() => runApplication(row.application.id)} title="Run" size="small" style={{ backgroundColor: '#75ea81', padding: '2px 0px' }}>
                              <IconButton variant="contained" color="primary"  style={{ color: '#12255f' }}>
                                <FaPlay />
                              </IconButton>
                            </Button>
                            <Button variant="contained" color="success" component={Link} to={`/view-application/${row.application.id}`} size="small" title="View" style={{ backgroundColor: '#75ea81', padding: '2px 0px', marginLeft: "5px" }}>
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
