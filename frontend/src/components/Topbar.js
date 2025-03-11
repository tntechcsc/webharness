import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Box, ButtonBase } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const Topbar = ({ onMenuClick, isNavOpen }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);

  
  const baseURL = "http://localhost:3000"; 

  useEffect(() => {
    const uri = `${baseURL}/api/user/info`;
    let session_id = sessionStorage.getItem("session_id");

    if (!session_id) {
      console.error("No session ID found in sessionStorage.");
      return;
    }

    console.log("Fetching user data from:", uri); 

    fetch(uri, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": session_id || "",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API request failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then((user) => {
        console.log("API Response:", user); 

        if (!user || !user.roleName) {
          console.warn("User roleName not found in API response.");
        }

        setUsername(user.username || "Unknown User");
        setRole(user.roleName || "Unknown Role"); 
      })
      .catch((error) => console.error("Error fetching user info:", error));
  }, []);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "rgba(18, 37, 95, 1)",
        boxShadow: "none",
        padding: "5px",
        paddingLeft: "0px",
      }}
    >
      <Toolbar variant="dense" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        
        <ButtonBase onClick={() => navigate("/")} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img
            src="/LogoHarness2.png" 
            alt="Project Logo"
            style={{ width: "50px", height: "50px" }}
          />
          <Typography variant="h6" color="" sx={{ fontWeight: "bold" }}>
            Project Mangrove
          </Typography>
        </ButtonBase>

        {/* 🔹 User Role  Icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountCircleIcon sx={{ color: "white" }} />
          <Typography variant="body1" color="inherit">
            {role ? role : "Loading..."} 
          </Typography>
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
