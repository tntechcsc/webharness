import React, { useEffect, useState } from "react";
import "../App";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Divider, Card, CardContent, Grid, CircularProgress, List, ListItem, ListItemText, } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, } from "recharts";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = "http://localhost:3000";

// Fake data
const baseURL = window.location.origin;

const failedApplicationsData = [
  { date: "Feb 20", count: 4 },
  { date: "Feb 21", count: 8 },
  { date: "Feb 22", count: 2 },
  { date: "Feb 23", count: 6 },
];

const recentLogins = [
  { user: "John Doe", time: "2025-02-24 10:15 AM" },
  { user: "Jane Smith", time: "2025-02-24 09:45 AM" },
  { user: "Alice Johnson", time: "2025-02-23 08:30 PM" },
];

const HomePage = () => {
  const theme = useTheme();
  const [activeApplications, setActiveApplications] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [username, setUsername] = useState("User"); // ✅ added username state

  // ✅ Fetch user's name
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

  // Fetch total applications
  useEffect(() => {
    const fetchTotalApplications = async () => {
      try {
        const response = await fetch(`${baseURL}:3000/api/applications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionStorage.getItem("session_id"),
          },
        });

        if (response.ok) {
          const data = await response.json();
          const applications = data.applications || [];
          setTotalApplications(applications.length);
        } else {
          console.error("Failed to fetch total applications");
        }
      } catch (error) {
        console.error("Error fetching total applications:", error);
      }
    };

    fetchTotalApplications();
  }, []);

  // WebSocket: Active Applications Count
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:3000/ws/process_count`);

    ws.onopen = () => console.log("WebSocket connected.");
    ws.onmessage = (event) => {
      const count = parseInt(event.data, 10);
      if (!isNaN(count)) setActiveApplications(count);
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed.");

    return () => ws.close();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: theme.palette.background.default,
        justifyContent: "center",
      }}
    >
      <Navbar />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Topbar />

        {/* ✅ Welcome Banner */}
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

        <Container sx={{ mt: 5, ml: 2, maxWidth: "xl" }}>
          <Grid container spacing={3}>
            {/* Applications Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ textAlign: "center", p: 3 }}>
                <CardContent>
                  <Typography variant="h6">Applications in Usage</Typography>
                  <CircularProgress
                    variant="determinate"
                    value={(activeApplications / totalApplications) * 100}
                    size={120}
                    thickness={5}
                  />
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    {activeApplications}/{totalApplications}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Failed Applications Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6">Failed Applications</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={failedApplicationsData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff6961" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Logins */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6">Recent Logins</Typography>
                  <Divider sx={{ my: 1 }} />
                  <List>
                    {recentLogins.map((login, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={login.user} secondary={login.time} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Events */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6">Upcoming Events</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">No events scheduled.</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* System Logs */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6">System Logs</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">[System] All services running smoothly.</Typography>
                  <Typography variant="body2">[Security] No unauthorized access detected.</Typography>
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