import React, { useState, useEffect } from "react";
import "../App"; // Ensure your styles are linked correctly
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Divider, Card, CardContent, Grid, CircularProgress, List, ListItem, ListItemText, Pagination } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";
import { useContext } from "react";
import { ThemeContext } from "../context/themecontext";

// Fake data
const baseURL = window.location.origin;

// Fake data
const failedApplicationsData = [
  { date: "Feb 20", count: 4 },
  { date: "Feb 21", count: 8 },
  { date: "Feb 22", count: 2 },
  { date: "Feb 23", count: 6 },
];

const HomePage = () => {
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);
  const [activeApplications, setActiveApplications] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);

  // Logs state and totals from backend
  const [recentLogins, setRecentLogins] = useState([]);
  const [recentLoginsTotal, setRecentLoginsTotal] = useState(0);
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLogsTotal, setSystemLogsTotal] = useState(0);
  const [systemLogsError, setSystemLogsError] = useState("");
  const [recentLoginsError, setRecentLoginsError] = useState("");


  // Pagination state for recent logins and system logs
  const [recentLoginsPage, setRecentLoginsPage] = useState(1);
  const [systemLogsPage, setSystemLogsPage] = useState(1);

  // Define limits for each paginated endpoint
  const recentLoginsLimit = 5;
  const systemLogsLimit = 5;

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
  }, []);

  // Helper function to fetch logs.
  // Expects a backend response with the shape { logs: [...], total: <number> }.
  const fetchLogsFor = async (eventType, page, limit, errorSetter) => {
    const offset = (page - 1) * limit;
    const url = eventType
      ? `${baseURL}:3000/api/system_logs?event_type=${eventType}&offset=${offset}&limit=${limit}`
      : `${baseURL}:3000/api/system_logs?offset=${offset}&limit=${limit}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionStorage.getItem("session_id"),
      },
    });
    if (response.status === 401) {
      errorSetter("You do not have permission to view logs.");
      return { logs: [], total: 0 };
    }
    if (response.ok) {
      const data = await response.json();
      errorSetter("");
      return { logs: data.logs || [], total: data.total || 0 };
    } else {
      console.error(`Failed to fetch logs for ${eventType || "system logs"}`);
      errorSetter("Failed to fetch logs.");
      return { logs: [], total: 0 };
    }
  };
  

  // Fetch recent logins when recentLoginsPage changes
  useEffect(() => {
    const fetchRecentLogins = async () => {
      const result = await fetchLogsFor("Login", recentLoginsPage, recentLoginsLimit, setRecentLoginsError);
      const { logs, total } = result;
      setRecentLogins(logs);
      setRecentLoginsTotal(total);
    };
    fetchRecentLogins();
  }, [recentLoginsPage]);

  // Fetch system logs when systemLogsPage changes
  useEffect(() => {
    const fetchSystemLogs = async () => {
      const result = await fetchLogsFor(null, systemLogsPage, systemLogsLimit, setSystemLogsError);
      const { logs, total } = result;
      setSystemLogs(logs);
      setSystemLogsTotal(total);
    };
    fetchSystemLogs();
  }, [systemLogsPage]);

  // WebSocket for active application count
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:3000/ws/process_count`);
    ws.onopen = () => console.log("WebSocket connection established for process count.");
    ws.onmessage = (event) => {
      const processCount = parseInt(event.data, 10);
      if (!isNaN(processCount)) {
        setActiveApplications(processCount);
      }
    };
    ws.onerror = (error) => console.error("WebSocket error:", error);
    ws.onclose = () => console.log("WebSocket connection closed.");
    return () => ws.close();
  }, []);

  return (
        <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          mode === "default"
            ? theme.custom?.gradients?.homeBackground || "linear-gradient(to bottom, #132060, #3e8e7e)"
            : theme.palette.background.default,
        justifyContent: "center"
      }}
      >
      <Navbar /> {/* Vertical navbar */}

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />
        {/* Welcome Banner */}
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
            {/* Active Applications */}
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
            {/* Failed Applications Bar Chart */}
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
            {/* Recent Logins Section */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2 }} id="recent-logins">
                <CardContent>
                  <Typography variant="h6">Recent Logins</Typography>
                  <Divider sx={{ my: 1 }} />
                  {recentLoginsError ? (
                    <Typography variant="body1" color="error">
                      {recentLoginsError}
                    </Typography>
                  ) : (
                    <>
                      <List>
                        {recentLogins.map((log, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemText
                              primary={`[${log.event}]`}
                              secondary={
                                <>
                                  <Typography variant="body2" color="textSecondary">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown Time"}
                                  </Typography>
                                  <Grid container spacing={0} sx={{ mt: 0 }}>
                                    {Object.entries(log.data).map(([key, value]) => (
                                      <Grid item xs={12} key={key}>
                                        <Typography variant="body2" color="textSecondary">
                                          <strong>{key}:</strong> {String(value)}
                                        </Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Pagination
                          count={Math.ceil(recentLoginsTotal / recentLoginsLimit)}
                          page={recentLoginsPage}
                          onChange={(e, value) => setRecentLoginsPage(value)}
                          variant="outlined"
                          shape="rounded"
                          siblingCount={1}
                          boundaryCount={1}
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            {/* System Logs Section */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 2 }} id="system-logs">
                <CardContent>
                  <Typography variant="h6">System Logs</Typography>
                  <Divider sx={{ my: 1 }} />
                  {systemLogsError ? (
                    <Typography variant="body1" color="error">
                      {systemLogsError}
                    </Typography>
                  ) : (
                    <>
                      <List>
                        {systemLogs.map((log, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemText
                              primary={`${log.event}`}
                              secondary={
                                <>
                                  <Typography variant="body2" color="textSecondary">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown Time"}
                                  </Typography>
                                  <Grid container spacing={0} sx={{ mt: 0 }}>
                                    {Object.entries(log.data).map(([key, value]) => (
                                      <Grid item xs={12} key={key}>
                                        <Typography variant="body2" color="textSecondary">
                                          <strong>{key}:</strong> {String(value)}
                                        </Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Pagination
                          count={Math.ceil(systemLogsTotal / systemLogsLimit)}
                          page={systemLogsPage}
                          onChange={(e, value) => setSystemLogsPage(value)}
                          variant="outlined"
                          shape="rounded"
                          siblingCount={1}
                          boundaryCount={1}
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    </>
                  )}
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
