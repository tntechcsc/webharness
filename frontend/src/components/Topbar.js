import React, { useState, useEffect, useContext } from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Brightness4, Brightness7 } from "@mui/icons-material"; // Theme icons
import { ThemeContext } from "../context/themecontext"; // ✅ Import ThemeContext
import logo from "../assets/LogoHarness.jpeg";
import { handleLogout } from "../utils/authUtils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useTheme } from '@mui/material/styles';
import { setHashLocation } from "../utils/utils.js"

const Topbar = () => {
  const { mode, toggleTheme } = useContext(ThemeContext); // ✅ Use ThemeContext

  const [username, setUsername] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const baseURL = window.location.origin;
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const uri = `${baseURL}:3000/api/user/info`;
    let session_id = sessionStorage.getItem("session_id");

    if (!session_id) return;

    fetch(uri, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": session_id || "",
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch user data")))
      .then((user) => {
        setUsername(user.username);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "primary.main", // ✅ Use primary color from theme
        boxShadow: 'none' }}>
      <Toolbar variant="dense" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* Left Side: Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: 50, marginRight: 10 }} />
          <Typography variant="h6" color="inherit">Mangrove</Typography>
        </Box>

        {/* Right Side: Theme Toggle, Profile */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* ✅ Theme Toggle Button (Placed BEFORE Profile) */}
          <IconButton
            onClick={toggleTheme}
            sx={{
              marginRight: 10,
              backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)", // ✅ Slight background tint
              color: mode === "dark" ? "#FFD700" : "#ffffff", // ✅ Yellowish icon in dark mode, dark icon in light mode
              borderRadius: "8px", // ✅ Softer rounded corners
              padding: "6px", // ✅ Slight padding for better visibility
              "&:hover": {
                backgroundColor: mode === "dark" ? "rgba(117, 234, 129, 255)" : "rgba(117, 234, 129, 255)", // ✅ Brighter hover effect
              },
            }}
          >
            {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>


          {/* Profile Section */}
          {username && (
            <>
              <IconButton onClick={handleMenuOpen} sx={{ padding: 0 }}>
                <Avatar src={profilePic} sx={{ width: 40, height: 40 }}>
                  {!profilePic && <AccountCircleIcon sx={{ fontSize: 40 }} />}
                </Avatar>
              </IconButton>

              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{ mt: 1 }}>
                <MenuItem onClick={() => (setHashLocation("profile"))}>View Profile</MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    withReactContent(Swal)
                      .fire({
                        title: <i>Warning</i>,
                        text: "Are you sure you want to log out?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes",
                        cancelButtonText: "No",
                      })
                      .then((result) => {
                        if (result.isConfirmed) {
                          handleLogout().then(() => {
                            sessionStorage.clear();
                            window.location.href = "/login";
                          });
                        }
                      });
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
