import React, { useState, useEffect, useContext } from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { ThemeContext } from "../context/themecontext";
import logo from "../assets/LogoHarness.jpeg";
import { handleLogout } from "../utils/authUtils";
import { setHashLocation } from "../utils/utils.js";

const Topbar = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);

  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const baseURL = window.location.origin;
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const uri = `${baseURL}:3000/api/user/info`;
    const session_id = sessionStorage.getItem("session_id");

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
        setRole(user.roleName);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#12255f",
          boxShadow: "none",
        }}
      >
        <Toolbar variant="dense" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo Section */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: 50, marginRight: 10 }} />
          <Typography variant="h6" color="inherit" sx={{ fontWeight: 'bold' }}>
            Project Mangrove
          </Typography>
          </Box>


          {/* Right Section: Theme Toggle + Profile Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Theme Toggle */}
            <IconButton
  onClick={toggleTheme}
  sx={{
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "6px",
    "&:hover": {
      backgroundColor: "rgba(117, 234, 129, 255)",
    },
  }}
>
  {mode === "light" && <DarkModeIcon />}
  {mode === "dark" && <SettingsBrightnessIcon />}
  {mode === "default" && <LightModeIcon />}
</IconButton>

            {/* Avatar + Role */}
            {username && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton onClick={handleMenuOpen} sx={{ padding: 0 }}>
                    <Avatar src={profilePic} sx={{ width: 40, height: 40 }}>
                      {!profilePic && <AccountCircleIcon sx={{ fontSize: 40 }} />}
                    </Avatar>
                  </IconButton>

                  {/* Role displayed to the right of the avatar */}
                  <Typography variant="body1" color="inherit" sx={{ whiteSpace: "nowrap" }}>
                    {role || "Loading..."}
                  </Typography>
                </Box>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{ mt: 1 }}>
                  <MenuItem onClick={() => setHashLocation("profile")}>View Profile</MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      setLogoutDialogOpen(true);
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>{"Log Out Confirmation"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setLogoutDialogOpen(false);
              handleLogout().then(() => {
                sessionStorage.clear();
                window.location.href = "/login";
              });
            }}
            color="primary"
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Topbar;
