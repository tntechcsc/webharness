import React, { useState, useEffect, useContext } from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { ThemeContext } from "../context/themecontext";
import logo from "../assets/LogoHarness.jpeg";
import { HandleLogout } from "../utils/authUtils";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const baseURL = "http://localhost";
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
          <Typography variant="h6" color="#ffffff" sx={{ fontWeight: 'bold' }}>
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
              aria-label="Toggle theme"
            >
              {mode === "light" && <DarkModeIcon />}
              {mode === "dark" && <SettingsBrightnessIcon />}
              {mode === "default" && <LightModeIcon />}
            </IconButton>

            {/* Avatar + Role */}
            {username && (
              <>
                <Box sx={{ display: "flex" , alignItems: "center", gap: 1 }}>
                  <IconButton onClick={handleMenuOpen} sx={{ padding: 0 }} aria-label="Open profile menu">
                    <Avatar src={profilePic} sx={{ width: 40, height: 40, backgroundColor: "#ffffff", color: "#12255f" }}>
                      {!profilePic && <AccountCircleIcon sx={{ fontSize: 40, }} />}
                    </Avatar>
                  </IconButton>

                  {/* Role displayed to the right of the avatar */}
                  <Typography variant="body1" color="#ffffff" sx={{ whiteSpace: "nowrap" }}>
                    {role || "Loading..."}
                  </Typography>
                </Box>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{ mt: 1 }}>
                  <MenuItem onClick={() => navigate("profile")}>View Profile</MenuItem>
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
          <Button
          onClick={() => setLogoutDialogOpen(false)}
          color="primary"
          variant="contained"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setLogoutDialogOpen(false);
              const response = await HandleLogout();

              if (response === true) {
                sessionStorage.clear();
                navigate("/login");
                console.log("logging them out")
              } else {
                //dont know what to do
              }
            }}
            variant="contained"
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
