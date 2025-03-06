import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Box } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import ViewListIcon from "@mui/icons-material/ViewList"
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, GridView } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

const Navbar = () => {
  const theme = useTheme();
  const drawerWidth = 200;
  const collapsedWidth = 60;

  // To keep the NAVBAR the same status 
  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem("drawerOpen");
    return savedState === null ? true : JSON.parse(savedState);
  });


  useEffect(() => {
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
          backgroundColor: theme.palette.primary.main,
          //borderRight: "2px solid #ffffff", // White border on the right side
          boxShadow: "2px 0px 10px rgba(0, 0, 0, 0.2)", // Subtle shadow effect
        },
      }}
    >
      {/* Toggle Button */}
      <IconButton onClick={() => setOpen(!open)} sx={{ margin: "10px" }}>
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>

      {/* Sidebar Menu */}
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <List sx={{ flexGrow: 1 }}>
          {/* Home Button */}
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/"
              sx={{
                justifyContent: "space-between", // Ensure equal distance
                //borderTop: "1px solid #ffffff",
                //borderBottom: "1px solid #ffffff", // Border line below
                "&:hover": {
                  backgroundColor: "#6FFB78",
                  color: "#fff",
                  transition: "background-color 0.3s ease-in-out",
                },
              }}
            >
              <ListItemIcon>
                <HomeIcon sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText primary="Home" sx={{ color: "white" }} />
            </ListItemButton>
          </ListItem>

          {/* Applications Button */}
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/applications"
              sx={{
                justifyContent: "space-between", // Ensure equal distance
                //borderBottom: "1px solid rgb(255, 255, 255)",
                "&:hover": {
                  backgroundColor: "#6FFB78",
                  color: "#fff",
                  transition: "background-color 0.3s ease-in-out",
                },
              }}
            >
              <ListItemIcon>
                <ViewListIcon sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText primary="Applications" sx={{ color: "white" }} />
            </ListItemButton>
          </ListItem>

          {/* Role Management Button */}
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/role-management"
              sx={{
                justifyContent: "space-between", // Ensure equal distance
                //borderBottom: "1px solid rgb(255, 255, 255)",
                "&:hover": {
                  backgroundColor: "#6FFB78",
                  transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
                },
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <SupervisorAccountIcon />
              </ListItemIcon>
              <ListItemText
                primary="Role"
                sx={{
                  color: "white",
                  "& .MuiListItemText-primary": { transition: "color 0.3s ease-in-out" },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Help Button */}
        <List>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/help" // actual help page route
              sx={{
                justifyContent: "space-between", // Ensure equal distance
                //borderBottom: "1px solid rgb(255, 255, 255)",
                "&:hover": {
                  backgroundColor: "#6FFB78",
                  transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
                },
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <HelpCenterIcon />
              </ListItemIcon>
              <ListItemText
                primary="Help"
                sx={{
                  color: "white",
                  "& .MuiListItemText-primary": { transition: "color 0.3s ease-in-out" },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Navbar;
