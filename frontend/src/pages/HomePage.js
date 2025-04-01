import React, { useState, useEffect } from "react";
import "../App"; // Ensure your styles are linked correctly
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Divider, Card, CardContent, Grid, CircularProgress, List, ListItem, ListItemText } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";


// Fake data
const baseURL = window.location.origin;
const failedApplicationsData = [
  { date: "Feb 20", count: 4 },
  { date: "Feb 21", count: 8 },
  { date: "Feb 22", count: 2 },
  { date: "Feb 23", count: 6 },
];

const HomePage = () => {
  const theme = useTheme();
  const [activeApplications, setActiveApplications] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [recentLogins, setRecentLogins] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  // Fetch total applications from the backend
  useEffect(() => {
    const fetchTotalApplications = async () => {
      try {
        const response = await fetch(`${baseURL}:3000/api/applications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionStorage.getItem("session_id"), // Include session ID if required
          },
        });

        if (response.ok) {
          const data = await response.json();
          const applications = data.applications || [];
          setTotalApplications(applications.length); // Update total applications count
        } else {
          console.error("Failed to fetch total applications");
        }
      } catch (error) {
        console.error("Error fetching total applications:", error);
      }
    };

    fetchTotalApplications();
  }, []); // Run only once when the component mounts

  // Fetch recent logins and system logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Fetch recent logins
        const loginResponse = await fetch(`${baseURL}:3000/api/system_logs?event_type=login`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionStorage.getItem("session_id"),
          },
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          setRecentLogins(loginData.logs || []);
        } else {
          console.error("Failed to fetch recent logins");
        }

        // Fetch all other system logs
        const logsResponse = await fetch(`${baseURL}:3000/api/system_logs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionStorage.getItem("session_id"),
          },
        });

        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setSystemLogs(logsData.logs || []);
        } else {
          console.error("Failed to fetch system logs");
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    fetchLogs();
  }, []); // Run only once when the component mounts

  useEffect(() => {
    // Establish WebSocket connection
    const ws = new WebSocket(`ws://${window.location.hostname}:3000/ws/process_count`);

    ws.onopen = () => {
      console.log("WebSocket connection established for process count.");
    };

    ws.onmessage = (event) => {
      const processCount = parseInt(event.data, 10); // Parse the process count from the WebSocket message
      if (!isNaN(processCount)) {
        setActiveApplications(processCount); // Update the state with the new process count
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden", backgroundColor: theme.palette.background.default, justifyContent: "center" }}>
      <Navbar /> {/* Vertical navbar */}

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar /> {/* Horizontal navbar */}

                {/* ✅ Welcome Banner Below Topbar */}
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
       <Typography variant="h5" sx={{ color: "white" }}>
        Welcome! Your dashboard is ready to go.
       </Typography>
        </Box>

        <Container sx={{ mt: 5, ml: 2, maxWidth: "xl" }}>
          <Grid container spacing={3}>
            {/* Large Centered Card for Active Applications */}
            <Grid item xs={12} md={6}>
              <Card sx={{ textAlign: "center", p: 3 }} id="applications-card">
                <CardContent>
                  <Typography variant="h6">Applications in Usage</Typography>
                  <CircularProgress 
                    id="active-applications"
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

            {/* Bar Chart for Failed Applications */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }} id="failed-applications">
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
              <Card sx={{ p: 2 }} id="recent-logins">
                <CardContent>
                  <Typography variant="h6">Recent Logins</Typography>
                  <Divider sx={{ my: 1 }} />
                  <List>
                    {recentLogins.map((log, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={log.data.actor || "Unknown User"}
                          secondary={log.data.timestamp || "Unknown Time"}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* System Logs */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 2 }} id="system-logs">
                <CardContent>
                  <Typography variant="h6">System Logs</Typography>
                  <Divider sx={{ my: 1 }} />
                  <List>
                    {systemLogs.map((log, index) => (
                      <ListItem key={index}>
                      <ListItemText
                        primary={`[${log.event}]`}
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown Time"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {JSON.stringify(log.data, null, 2)}
                            </Typography>
                          </>
                        }                        
                      />
                    </ListItem>
                                       
                    ))}
                  </List>
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
