import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AppsIcon from "@mui/icons-material/Apps";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon, HelpOutline as HelpOutlineIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

const Navbar = ({ toggleTheme }) => {
  const theme = useTheme();
  const drawerWidth = 200;
  const collapsedWidth = 60;
  const [open, setOpen] = useState(() => {
    // Retrieve the drawer state from localStorage
    const savedState = localStorage.getItem("drawerOpen");
    return savedState === null ? true : JSON.parse(savedState);
  });

  useEffect(() => {
    // Save the drawer state to localStorage whenever it changes
    localStorage.setItem("drawerOpen", JSON.stringify(open));
  }, [open]);

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
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        },
      }}
    >
      <div>
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
            <ListItemButton component={Link} to="/" sx={{ padding: "10px 16px" }}>
              <ListItemIcon sx={{ color: "white" }}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/applications" sx={{ padding: "10px 16px" }}>
              <ListItemIcon sx={{ color: "white" }}>
                <AppsIcon />
              </ListItemIcon>
              <ListItemText primary="Applications" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/role-management">
              <ListItemIcon sx={{ color: "white" }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Role Management" />
            </ListItemButton>
          </ListItem>
        </List>
      </div>

      <div>
        <ListItem disablePadding sx={{ marginBottom: "10px" }}>
          <ListItemButton component={Link} to="/about" sx={{ justifyContent: "left", padding: "10px 16px" }}>
            <ListItemIcon sx={{ color: "white" }}>
              <HelpOutlineIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Help" sx={{ color: "white" }} />}
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ marginBottom: "10px" }}>
          <ListItemButton onClick={toggleTheme} sx={{ justifyContent: "left", padding: "10px 16px" }}>
            <ListItemIcon sx={{ color: "white" }}>
              <Brightness4Icon />
            </ListItemIcon>
            {open && <ListItemText primary="Dark Mode" sx={{ color: "white" }} />}
          </ListItemButton>
        </ListItem>
      </div>
    </Drawer>
  );
};

export default Navbar;
