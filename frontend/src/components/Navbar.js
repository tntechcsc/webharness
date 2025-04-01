import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import ViewListIcon from "@mui/icons-material/ViewList";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useStartTutorial } from "../utils/tutorial";

const Navbar = () => {
  const { startTutorialManually } = useStartTutorial();
  const theme = useTheme();
  const location = useLocation();
  const drawerWidth = 200;
  const collapsedWidth = 60;

  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem("drawerOpen");
    return savedState === null ? true : JSON.parse(savedState);
  });

  useEffect(() => {
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
          borderRight: "2px solid #ffffff", // White border on the right
          boxShadow: "2px 0px 10px rgba(0, 0, 0, 0.2)", // Subtle shadow
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
          <ListItemButton
            component={Link}
            to="/"
            sx={{
              justifyContent: "space-between",
              borderTop: "1px solid #ffffff",
              borderBottom: "1px solid #ffffff",
              "&:hover": {
                backgroundColor: "#6FFB78",
                color: "#fff",
                transition: "background-color 0.3s ease-in-out",
              },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>< HomeIcon /></ListItemIcon>
            <ListItemText primary="Home" sx={{ color: "white" }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/applications"
            sx={{
              justifyContent: "space-between",
              borderBottom: "1px solid #ffffff",
              "&:hover": {
                backgroundColor: "#6FFB78",
                color: "#fff",
                transition: "background-color 0.3s ease-in-out",
              },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>< ViewListIcon /></ListItemIcon>
            <ListItemText primary="Applications" sx={{ color: "white" }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/role-management"
            sx={{
              justifyContent: "space-between",
              borderBottom: "1px solid #ffffff",
              "&:hover": {
                backgroundColor: "#6FFB78",
                color: "#fff",
                transition: "background-color 0.3s ease-in-out",
              },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}><SupervisorAccountIcon /></ListItemIcon>
            <ListItemText primary="Roles" sx={{ color: "white" }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              const pageKey = getPageKey();
              if (pageKey) {
                startTutorialManually(pageKey);
              }
            }}
            sx={{
              justifyContent: "space-between",
              borderBottom: "1px solid #ffffff",
              "&:hover": {
                backgroundColor: "#6FFB78",
                color: "#fff",
                transition: "background-color 0.3s ease-in-out",
              },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}><HelpCenterIcon /></ListItemIcon>
            <ListItemText primary="Tutorial" sx={{ color: "white" }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Navbar;
