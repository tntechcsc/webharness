import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import "bootstrap/dist/css/bootstrap.min.css";
import { useTheme } from "@mui/material/styles";
import logo from "../assets/LogoHarness.jpeg";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';



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
    const [profilePic, setProfilePic] = useState(null); //Placeholder for profile picture
    const baseURL = window.location.origin;
    const [anchorEl, setAnchorEl] = useState(null); // Controls dropdown visibility

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

    // Open & Close dropdown menu
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    return (
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar variant="dense" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo Section */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img src={logo} alt="Logo" style={{ height: 50, marginRight: 10 }} />
            <Typography variant="h6" color="inherit">Mangrove</Typography>
          </Box>
  
          {username && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "auto" }}>
              {/*Profile Button */}
              <IconButton onClick={handleMenuOpen} sx={{ padding: 0 }}>
                <Avatar src={profilePic} sx={{ width: 40, height: 40 }}>
                  {!profilePic && <AccountCircleIcon sx={{ fontSize: 40 }} />} {/* Default icon*/}
                </Avatar>
              </IconButton>
  
              {/* Username & Role */}
              <Typography variant="body2" color="inherit">{username}</Typography>
  
              {/* Dropdown Menu */}
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{ mt: 1 }}>
                <MenuItem onClick={() => window.location.href = "/profile"}>View Profile</MenuItem>
                <MenuItem onClick={() => {
                  sessionStorage.clear(); //we have a logout function bro
                  window.location.href = "/login";
                }}>Logout</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
    );
  };

export default Topbar;