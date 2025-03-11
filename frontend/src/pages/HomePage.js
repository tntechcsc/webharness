import React from "react";
import "../App"; // Ensure your styles are linked correctly
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Divider, Card, CardContent, Grid, CircularProgress, List, ListItem, ListItemText } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";


// Fake data
const totalApplications = 50;
const activeApplications = 30;
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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden", backgroundColor: theme.palette.background.default}}>
      <Navbar /> {/* Vertical navbar */}

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar /> {/* Horizontal navbar */}

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

            {/* Two Smaller Cards for Recent Logins & Placeholder for Additional Data */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2 }} id="recent-logins">
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

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2 }} id="upcoming-events">
                <CardContent>
                  <Typography variant="h6">Upcoming Events</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">No events scheduled.</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Full-width Card for Additional Info or Logs */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 2 }} id="system-logs">
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
