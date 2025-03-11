import React, { useState, useEffect } from "react";
import { 
  Box, Container, Typography, TextField, Button, Avatar, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions 
} from "@mui/material";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { useTheme } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import FormControlLabel from '@mui/material/FormControlLabel';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyboardCapslockIcon from '@mui/icons-material/KeyboardCapslock';
import Checkbox from '@mui/material/Checkbox';


const baseURL = window.location.origin;

const Profile = () => {
  const theme = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsLockEnabled, setCapsLockEnabled] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCapsLock = (e) => {
    const capsLockOn = e.getModifierState("CapsLock");
    setCapsLockEnabled(capsLockOn);
  };



  useEffect(() => {
    const fetchProfile = async () => {
      let session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        return;
      }

      try {
        const response = await fetch(`${baseURL}:3000/api/user/info`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": session_id || "",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch profile");

        const user = await response.json();
        setUserData(user);
        setProfilePic(user.profilePicture || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;
    return regex.test(password);
  };

  // Handle password change request
  const handleChangePassword = async () => {
    if (!validatePassword(newPassword)) {
      setPasswordError("Password must be at least 8 characters, include an uppercase letter, a number, and a special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    let session_id = sessionStorage.getItem("session_id");
    if (!session_id) {
      setPasswordError("Session expired. Please log in again.");
      return;
    }
  
    try {
      const response = await fetch(`${baseURL}:3000/api/user/set-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id,
        },
        body: JSON.stringify({ new_password: newPassword }), // Send password data
      });
  
      if (!response.ok) throw new Error("Failed to set password.");
  
      withReactContent(Swal).fire({
        title: <i>Success</i>,
        text: "Your password has been updated successfully!",
        icon: "success",
      });      
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (error) {
      console.error("Error setting password:", error);
      setPasswordError("Failed to update password. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <Navbar />

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        <Topbar />

        <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          {/* Profile Picture */}
          <Paper sx={{ p: 4, maxWidth: 600, width: "100%", textAlign: "center", backgroundColor: theme.palette.background.paper }}>
            <Avatar
              src={profilePic}
              sx={{ width: 100, height: 100, margin: "auto", mb: 2, bgcolor: theme.palette.primary.main }}
            >
              {!profilePic && <AccountCircleIcon sx={{ fontSize: 100, color: theme.palette.primary.contrastText }} />}
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: "bold", color: theme.palette.text.primary }}>
              {userData?.username || "User"}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {userData?.roleName || "Role not available"}
            </Typography>

            {/* Email*/}
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={userData?.email || ""}
            />

            {/* Reset Password Button*/}
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, py: 1.5 }}
              onClick={() => setPasswordDialogOpen(true)}
            >
              Reset Password
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle sx={{ color: theme.palette.text.primary }}>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            margin="normal"
            value={newPassword}
            onKeyUp={handleCapsLock}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Must be 8+ characters, 1 uppercase, 1 number, 1 special character"
          />
          <TextField
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            margin="normal"
            onKeyUp={handleCapsLock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                icon={<VisibilityOff />}
                checkedIcon={<Visibility/>}
                onChange={togglePasswordVisibility}
                sx={{
                  color: theme.palette.text.primary,
                  '&.Mui-checked': {
                    color: "#6ffb78",
                  },
                }}
              />
            }
            label="Show Password"
          />
          {capsLockEnabled && (
            <div className="caps-lock-warning mb-3" style={{ color: 'red', position: 'relative', zIndex: '5' }}>
              <KeyboardCapslockIcon style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Caps Lock is on
            </div>
          )}
          {passwordError && (
            <Typography color="error" variant="body2">
              {passwordError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPasswordDialogOpen(false)} 
            sx={{ bgcolor: "red", color: "white", "&:hover": { bgcolor: "#CC0000" } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" 
            color="primary"
            onClick={handleChangePassword} 
            disabled={!newPassword || !confirmPassword}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
