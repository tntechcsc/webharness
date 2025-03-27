import React, { useState, useEffect, useContext } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { DarkMode, WbSunny, AutoAwesome } from "@mui/icons-material"; // ✅ NEW ICONS
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { ThemeContext } from "../context/themecontext";
import logo from "../assets/LogoHarness.jpeg";
import { handleLogout } from "../utils/authUtils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Topbar = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const baseURL = window.location.origin;

  useEffect(() => {
    const session_id = sessionStorage.getItem("session_id");
    if (!session_id) return;

    fetch(`${baseURL}:3000/api/user/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": session_id,
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

  // ✅ Friendly tooltip label for current icon (next mode)
  const getNextModeLabel = () => {
    if (mode === "light") return "Switch to Dark Mode";
    if (mode === "default") return "Switch to Light Mode";
    return "Switch to Default Mode";
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#12255f", boxShadow: "none" }}>
      <Toolbar variant="dense" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* 🔹 Logo + Title */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: 50, marginRight: 10 }} />
          <Typography variant="h6" color="inherit" sx={{ fontWeight: "bold" }}>
            Project Mangrove
          </Typography>
        </Box>

        {/* 🔹 Right Side: Theme Toggle + Avatar + Role */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title={getNextModeLabel()}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                marginRight: 2,
                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff",
                color: mode === "dark" ? "#FFD700" : "#132060",
                borderRadius: "8px",
                padding: "6px",
                "&:hover": {
                  backgroundColor: "#e0e0e0",
                },
              }}
            >
              {mode === "light" && <DarkMode />}   {/* To Default */}
              {mode === "default" && <WbSunny />}     {/* To Dark */}
              {mode === "dark" && <AutoAwesome />}         {/* To Light */}
            </IconButton>
          </Tooltip>

          {/* Avatar + Role */}
          <IconButton onClick={handleMenuOpen} sx={{ padding: 0, marginRight: 1 }}>
            <Avatar src={profilePic} sx={{ width: 40, height: 40 }}>
              {!profilePic && <AccountCircleIcon sx={{ fontSize: 40 }} />}
            </Avatar>
          </IconButton>

          {role && (
            <Typography variant="body2" color="white" sx={{ fontStyle: "italic" }}>
              {role}
            </Typography>
          )}

          {/* Profile Menu */}
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => (window.location.href = "/profile")}>View Profile</MenuItem>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
