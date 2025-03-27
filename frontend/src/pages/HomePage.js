import React, { useEffect, useState, useContext } from "react";
import "../App";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ThemeContext } from "../context/themecontext";

const API_BASE_URL = "http://localhost:3000";

const HomePage = () => {
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);

  const [username, setUsername] = useState("User");
  const [totalApplications, setTotalApplications] = useState(0);
  const [activeApplications, setActiveApplications] = useState([]); // ✅ now a list
  const [totalUsers, setTotalUsers] = useState(0);
  const [systemLogs, setSystemLogs] = useState([]);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const session_id = sessionStorage.getItem("session_id");
        if (!session_id) return;

        const res = await fetch(`${API_BASE_URL}/api/user/info`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": session_id,
          },
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

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionStorage.getItem("session_id"),
          },
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard stats");

        const data = await res.json();
        setTotalUsers(data.totalUsersRegistered || 0);
        setSystemLogs(data.systemLogs || []);
        setActiveApplications(data.applicationsInUse || []); // ✅ get active apps
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  // Fetch total applications (separate endpoint)
  useEffect(() => {
    const fetchTotalApplications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionStorage.getItem("session_id"),
          },
        });

        if (!res.ok) throw new Error("Failed to fetch applications");

        const data = await res.json();
        setTotalApplications(data.applications?.length || 0);
      } catch (error) {
        console.error("Error fetching total applications:", error);
      }
    };

    fetchTotalApplications();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          mode === "default"
            ? theme.custom?.gradients?.homeBackground || "linear-gradient(to bottom, #132060, #3e8e7e)"
            : theme.palette.background.default,
      }}
    >
      <Navbar />

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />

        {/* ✅ Welcome Banner */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: theme.palette.background.banner || "#0A192F",
            color: "#fff",
            textAlign: "center",
            py: 2,
            boxShadow: theme.shadows[4],
          }}
        >
          <Typography variant="h5">
            Welcome, {username}! Your dashboard is ready to go.
          </Typography>
        </Box>

        {/* ✅ Cards Section */}
        <Container sx={{ mt: 5, maxWidth: "xl" }}>
          <Grid container spacing={3}>
            {/* Total Applications */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: theme.palette.primary.main, color: "white", borderRadius: 3 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h6">Total Applications</Typography>
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold", color: theme.palette.secondary.main }}>
                    {totalApplications}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Registered Users */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: theme.palette.primary.main, color: "white", borderRadius: 3 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h6">Total Registered Users</Typography>
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold", color: theme.palette.secondary.main }}>
                    {totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Applications */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: theme.palette.primary.main, color: "white", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ textAlign: "center" }}>Active Applications</Typography>
                  <Box sx={{ maxHeight: 150, overflowY: "auto", mt: 2, backgroundColor: theme.palette.background.default, borderRadius: 1, p: 2 }}>
                    {activeApplications.length > 0 ? (
                      <List>
                        {activeApplications.map((app, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={app} sx={{ color: "#000000", fontWeight: "bold" }} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography sx={{ color: theme.palette.text.primary }}>No active applications found.</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* System Logs */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: theme.palette.primary.main, color: "white", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ textAlign: "center" }}>System Logs</Typography>
                  <Box sx={{ maxHeight: 150, overflowY: "auto", mt: 2, backgroundColor: theme.palette.background.default, borderRadius: 1, p: 2 }}>
                    <List>
                      {systemLogs.map((log, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={log} sx={{ color: "#000000", fontWeight: "bold" }} />
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
