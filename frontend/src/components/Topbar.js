import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import "bootstrap/dist/css/bootstrap.min.css";
import { useTheme } from "@mui/material/styles";
import logo from "../assets/LogoHarness.jpeg";



const Topbar = () => {
  /*
  <div className="navbar">
      <div className="sidebar">
        <div className="logo-button">
        <div style={{ textDecoration: 'none' }} className="nav-button">
            <img
              src={placeholder}
              alt="Profile"
              className="rounded-circle border"
              width="75"
              height="75"
              onClick={() => window.location.href = "/profile"}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div style={{ textDecoration: 'none' }} className="nav-button">
            <img 
              src="LogoHarness2.png" 
              alt="Logo" 
              style={{ width: '8 rem', height: '10rem'}} 
              onClick={() => window.location.href = "/"}
            />
          </div>
        </div>
        <div style={{ textDecoration: 'none' }} className="nav-button" onClick={() => window.location.href = "/Applications"}>Application</div>
        <div to="/role-management" style={{ textDecoration: 'none' }} className="nav-button" onClick={() => window.location.href = "/role-management"}>Role Management</div>
        <Link to="/login" style={{ textDecoration: 'none' }} className="nav-button" onClick={() => {handleLogout()}}>Logout</Link>
      </div>
    </div>
  */
    const theme = useTheme();
    const [username, setUsername] = useState(null);
    const [role, setRole] = useState(null);
  
    const baseURL = window.location.origin;
  
    useEffect(() => {
      const uri = `${baseURL}:3000/api/user/info`;
      let session_id = sessionStorage.getItem("session_id");
  
      if (!session_id) {
        return;
      }
  
      fetch(uri, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id || "",
        },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("Failed to fetch user data");
          }
        })
        .then((user) => {
          setUsername(user.username);
          setRole(user.roleName);
        })
        .catch((error) => console.error(error));
    }, []);
  return (
    <AppBar position="static" sx={{backgroundColor: theme.palette.primary.main}}>
        <Toolbar variant="dense">
          {/* Logo Section*/}
          <img src={logo} alt="Logo" style={{ height: 60 }}/>
            <Typography variant="body1" color="inherit" sx={{ marginLeft: "auto" }}>
                {role}
            </Typography>
        </Toolbar>
    </AppBar>
  );
};

export default Topbar;