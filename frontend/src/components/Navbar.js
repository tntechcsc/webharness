import React, {useState, useEffect } from "react";
import {Link, useLocation} from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { startTutorialManually } from "../utils/tutorial";
import { useStartTutorial } from "../utils/tutorial";

const Navbar = () => {
  const { startTutorialManually } = useStartTutorial();
  const theme = useTheme();
  const location = useLocation();
  const drawerWidth = 200;
  const collapsedWidth = 60;
  
  const [open, setOpen] = useState(() => {
    // Retrieve the draawer state from localStorage
    const savedState = localStorage.getItem("drawerOpen");
    return savedState === null ? true : JSON.parse(savedState);
  });

  useEffect(() => {
    // Save the drawer state to localStorage whenever it chaanges
    localStorage.setItem("drawerOpen", JSON.stringify(open));
  }, [open]);

  const getPageKey = () => {
    if (location.pathname === "/") return "homepage";
    if (location.pathname.includes("applications")) return "applications";
    if (location.pathname.includes("profile")) return "profile";
    if (location.pathname.includes("role-management")) return "role-management";
    return null;
  };  

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : collapsedWidth,
          transition: "width 0.3s ease-in-out, background-color 0.3s ease-in-out",
          overflowX: "hidden",
          backgroundColor: theme.palette.secondary.main,
        },
      }}
    >
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{
          margin: "10px",
          color: "white",
          transition: "transform 0.3s ease-in-out, color 0.3s ease-in-out",
          transform: open ? "rotate(0deg)" : "rotate(180deg)",
        }}
      >
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>

      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/">
            <ListItemIcon sx={{ color: "white" }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/applications">
            <ListItemIcon sx={{ color: "white" }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Applications" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/role-management">
            <ListItemIcon sx={{ color: "white" }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Role" />
          </ListItemButton>
        </ListItem>

        {/* Start Tutorial Button */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            const pageKey = getPageKey();
            if (pageKey) {
              startTutorialManually(pageKey);
            }
          }}>
            <ListItemIcon sx={{ color: "white" }}>
              <PlayCircleOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Tutorial" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Navbar;
