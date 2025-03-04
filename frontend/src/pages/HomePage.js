import React, { useState } from "react";
import "../App"; 
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { Box, Container, Typography, Card, CardContent, Grid, List, ListItem, ListItemText, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import "bootstrap/dist/css/bootstrap.min.css";

// Mock Data 
const totalApplications = 15;
const totalUsersRegistered = 80;

const allApplications = [
  "Aegis Combat System", "SPY-6", "Tomahawk Program", "Sub-Ballistic"
];

const HomePage = () => {
  const theme = useTheme();
  const [applicationsInUse, setApplicationsInUse] = useState([...allApplications]);
  const [systemLogs, setSystemLogs] = useState(["[System] Monitoring system activity..."]);
  const [isNavOpen, setIsNavOpen] = useState(true);



  const handleStopApplication = (appToStop) => {
    setApplicationsInUse(applicationsInUse.filter(app => app !== appToStop));
    setSystemLogs(prevLogs => [`[Stopped] ${appToStop} has been terminated.`, ...prevLogs]); // Add log entry
  };

  
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", color: "#12255f", overflow: "hidden", backgroundColor: theme.palette.background.default }}>
      <Navbar /> {/* Vertical navbar */}

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar /> {/* Horizontal navbar */}

        <Container sx={{ mt: 5, maxWidth: "xl" }}>
          <Grid container spacing={3} justifyContent="center" alignItems="stretch"> 
            
            {/* Applications Active Card */}
            {/* Applications Active Card */}
<Grid item xs={12} md={4}> 
      <Card sx={{ p: 3, backgroundColor: "#12255f", color: "white", height: "100%" }}>
        <CardContent>
          <Typography variant="h6">
            Currently, there are <span style={{ color: "#6FFB78", fontWeight: "bold" }}>{applicationsInUse.length}</span> applications active.
          </Typography>

          {/* Divider */}
          <Divider sx={{ my: 2, backgroundColor: "white" }} />

          {/* Active Applications List */}
          <Typography variant="h6">Active Applications</Typography>
          <Box sx={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "5px", p: 2, backgroundColor: "white" }}>
            <List>
              {applicationsInUse.map((app, index) => (
                <ListItem 
                  key={index} 
                  sx={{ display: "flex", justifyContent: "space-between", borderBottom: index !== applicationsInUse.length - 1 ? "1px solid #ddd" : "none" }}
                >
                  <ListItemText primary={app} sx={{ color: "black", fontWeight: "bold" }} />
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleStopApplication(app)}
                    sx={{
                      backgroundColor: "red", // ✅ Solid red background
                      color: "white", // ✅ White text for contrast
                      "&:hover": { backgroundColor: "#b30000" } // ✅ Darker red on hover
                    }}
                  >
                    Stop
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>
</Grid>


           
            {/* System Logs Card */}
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

            
            <Grid item xs={12} md={4}>
              <Grid container spacing={3} direction="column"> 

                {/* Total Applicants Card */}
                <Grid item xs={12}>
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

                {/* Total Users Registered Card */}
                <Grid item xs={12}>
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
            </Grid>

          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
