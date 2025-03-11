import React, { useState, useEffect } from "react";
import "../App"; 
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Card, CardContent, Grid, List, ListItem, ListItemText, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = "http://localhost:3000"; 

const HomePage = () => {
  const theme = useTheme();
  const [applicationsInUse, setApplicationsInUse] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalUsersRegistered, setTotalUsersRegistered] = useState(0);
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let session_id = sessionStorage.getItem("session_id");
        if (!session_id) return;

        const res = await fetch(`${API_BASE_URL}/api/user/info`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-session-id": session_id },
        });

        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setUsername(data.username || "User");
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let session_id = sessionStorage.getItem("session_id");
        if (!session_id) return;

        const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-session-id": session_id },
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await res.json();

        setTotalApplications(data.totalApplications || 0);
        setTotalUsersRegistered(data.totalUsersRegistered || 0);
        setApplicationsInUse(data.applicationsInUse || []);
        setSystemLogs(data.systemLogs || []);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden", background: "linear-gradient(180deg, #1e3c72 50%, white 100%)"}}>
      <Navbar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />

        {/* ✅ Banner with Welcome Message */}
        <Box 
          sx={{ 
            width: "100%", 
            backgroundColor: "#0A192F",
            color: "white", 
            textAlign: "center",
            py: 2, 
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Typography variant="h5">
            Welcome, {username}! Your dashboard is ready to go.
          </Typography>
        </Box>

        <Container sx={{ mt: 5, maxWidth: "xl" }}>
          <Grid container spacing={3}>

            {/* 🔹 Total Applications Card with Shadow */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                textAlign: "center", 
                p: 3, 
                backgroundColor: "#132060", 
                color: "white",
                borderRadius: "20px",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
                transition: "all 0.3s ease-in-out",
                "&:hover": { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)" }
              }}>
                <CardContent>
                  <Typography variant="h6">Total Applications</Typography>
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold", color: "#6FFB78" }}>
                    {totalApplications}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 🔹 Registered Users Card with Shadow */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                textAlign: "center", 
                p: 3, 
                backgroundColor: "#132060", 
                color: "white",
                borderRadius: "20px",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)", 
                transition: "all 0.3s ease-in-out",
                "&:hover": { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)" }
              }}>
                <CardContent>
                  <Typography variant="h6">Total Registered Users</Typography>
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold", color: "#6FFB78" }}>
                    {totalUsersRegistered}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 🔹 System Logs Panel with Shadow */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                p: 2, 
                backgroundColor: "#132060", 
                color: "white",
                borderRadius: "20px",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)", 
                transition: "all 0.3s ease-in-out",
                "&:hover": { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)" }
              }}>
                <CardContent>
                  <Typography variant="h6">System Logs</Typography>
                  <Box sx={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "5px", p: 2, backgroundColor: "white" }}>
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

            {/* 🔹 Currently Active Applications Panel with Shadow */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                p: 2, 
                backgroundColor: "#132060", 
                color: "white",
                borderRadius: "20px",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)", 
                transition: "all 0.3s ease-in-out",
                "&:hover": { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)" }
              }}>
                <CardContent>
                  <Typography variant="h6">Currently Active Applications</Typography>
                  <Box sx={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "5px", p: 2, backgroundColor: "white" }}>
                    <List>
                      {applicationsInUse.map((app, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={app} sx={{ color: "black", fontWeight: "bold" }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
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
