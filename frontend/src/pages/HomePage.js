import React, { useState, useEffect } from "react";
import "../App"; 
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Card, CardContent, Grid, List, ListItem, ListItemText, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = "http://localhost:3000"; 

const HomePage = () => {
  const theme = useTheme();
  const [applicationsInUse, setApplicationsInUse] = useState([]);
  const [systemLogs, setSystemLogs] = useState(["[System] Monitoring system activity..."]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalUsersRegistered, setTotalUsersRegistered] = useState(0);

  // Fetch Applications & System Logs from Backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let session_id = sessionStorage.getItem("session_id");
        if (!session_id) {
          console.error("No session ID found in sessionStorage.");
          return;
        }

        const [appsRes, logsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/applications`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "x-session-id": session_id },
          }),
          fetch(`${API_BASE_URL}/api/logs`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "x-session-id": session_id },
          }),
          fetch(`${API_BASE_URL}/api/stats`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "x-session-id": session_id },
          }),
        ]);

        if (!appsRes.ok || !logsRes.ok || !statsRes.ok) throw new Error("Failed to fetch data");

        const appsData = await appsRes.json();
        const logsData = await logsRes.json();
        const statsData = await statsRes.json();

        setApplicationsInUse(appsData.applications || []);
        setSystemLogs(logsData.logs || []);
        setTotalApplications(statsData.totalApplications || 0);
        setTotalUsersRegistered(statsData.totalUsers || 0);
      } catch (error) {
        console.error(" Backend unavailable, using mock data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", color: "#12255f", overflow: "hidden", backgroundColor: theme.palette.background.default }}>
      <Navbar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />
        <Container sx={{ mt: 5, maxWidth: "xl" }}>
          <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            
            {/* Applications Active Card */}
            <Grid item xs={12} md={4}> 
              <Card sx={{ p: 3, backgroundColor: "#12255f", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="h6">
                    Currently, there are <span style={{ color: "#6FFB78", fontWeight: "bold" }}>{applicationsInUse.length}</span> applications active.
                  </Typography>
                  <Divider sx={{ my: 2, backgroundColor: "white" }} />
                  <Typography variant="h6">Active Applications</Typography>
                  <Box sx={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "5px", p: 2, backgroundColor: "white" }}>
                    <List>
                      {applicationsInUse.map((app, index) => (
                        <ListItem key={index} sx={{ display: "flex", justifyContent: "space-between", borderBottom: index !== applicationsInUse.length - 1 ? "1px solid #ddd" : "none" }}>
                          <ListItemText primary={app.application.name} sx={{ color: "black", fontWeight: "bold" }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* System Logs */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, backgroundColor: "#12255f", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="h6">System Logs</Typography>
                  <Divider sx={{ my: 2, backgroundColor: "white" }} />
                  <Box sx={{ maxHeight: "250px", overflowY: "auto", p: 2, backgroundColor: "white", borderRadius: "5px" }}>
                    <List>
                      {systemLogs.map((log, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={log} sx={{ color: "black", fontWeight: "bold" }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Dashboard Statistics */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, backgroundColor: "#12255f", color: "white" }}>
                <CardContent>
                  <Typography variant="h6">Total Applications</Typography>
                  <Divider sx={{ my: 2, backgroundColor: "white" }} />
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#6FFB78" }}>
                    {totalApplications}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, backgroundColor: "#12255f", color: "white" }}>
                <CardContent>
                  <Typography variant="h6">Total Users Registered</Typography>
                  <Divider sx={{ my: 2, backgroundColor: "white" }} />
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#6FFB78" }}>
                    {totalUsersRegistered}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
