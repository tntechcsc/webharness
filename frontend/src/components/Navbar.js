import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";


const Navbar = () => {
  const theme = useTheme();
  const drawerWidth = 200;
  const collapsedWidth = 60;
  const [open, setOpen] = useState(true)

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : collapsedWidth,
          transition: "width 0.3s ease-in-out",
          overflowX: "hidden",
          backgroundColor: theme.palette.secondary.main
        },
      }}
    >

      <IconButton onClick={() => setOpen(!open)} sx={{ margin: "10px" }}>
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>

      <List>
        <ListItem disablePadding>

          <ListItemButton component={Link} to="/">
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

        </ListItem>

        <ListItem disablePadding>

          <ListItemButton component={Link} to="/applications">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Program" />
          </ListItemButton>

        </ListItem>

        <ListItem disablePadding>

          <ListItemButton component={Link} to="/role-management">
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Role Management" />
          </ListItemButton>

        </ListItem>

      </List>
    </Drawer>
  );
};

export default Navbar;
