import React from "react";
import { Box, TextField, Button, Typography, Container, Paper, Alert, IconButton, InputAdornment,} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import KeyboardCapslockIcon from '@mui/icons-material/KeyboardCapslock';
import axios from "axios";


const Login = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsLockEnabled, setCapsLockEnabled] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");
  const [loginSuccess, setLoginSuccess] = React.useState("");

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleCapsLock = (e) => {
    const isCaps = e.getModifierState && e.getModifierState("CapsLock");
    setCapsLockEnabled(isCaps);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    const baseURL = window.location.origin;

    axios
      .post(`${baseURL}:3000/api/user/login`, { username, password })
      .then((response) => {
        sessionStorage.setItem("session_id", response.data.session_id);
        setLoginSuccess("Login successful!");
        setLoginError("");
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("Login error:", error);
        setLoginError("Login failed. Please check your username and password.");
        setLoginSuccess("");
      });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to top, #afb9c8, #9eaabc , #8e9cb1, #7e8ea6 ,  #6e809b,  #5e7290, #475e80,  #304a70, #193660 , #143161, #112c61, #102661, #132060, #111d56 , #0f1a4d, #0b133a)",
      }}
    >


      <Container maxWidth="sm">
        <Paper
          elevation={20}
          sx={{
            position: "relative",
            p: 4,
            borderRadius: "16px",
            textAlign: "center",
            background: "linear-gradient(to bottom, #132060 0%, #2b3670 100%)",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)",
            },
          }}
        >

          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
              zIndex: 1,
              position: "relative",
            }}
          >
            <img
              src="LogoHarness2.png"
              alt="Logo"
              style={{ maxWidth: "150px", maxHeight: "150px" }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: "bold",
              mb: 3,
              zIndex: 1,
              position: "relative",
            }}
          >
            Mangrove
          </Typography>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            <TextField
              name="username"
              variant="outlined"
              fullWidth
              required
              size="small"
              onKeyUp={handleCapsLock}
              placeholder="Username"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "5px",
                },
                "& .MuiInputBase-input": {
                  color: "black", 
                },
                "& ::placeholder": {
                  color: "gray", 
                  opacity: 1,
                },
              }}
            />

              <TextField
                name="password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                required
                size="small"
                onKeyUp={handleCapsLock}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "5px",
                  },
                  "& .MuiInputBase-input": {
                    color: "black",
                  },
                  "& ::placeholder": {
                    color: "gray",
                    opacity: 1,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

            {/* Caps Lock Warning */}
            {capsLockEnabled && (
              <Box sx={{ color: "red", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <KeyboardCapslockIcon />
                <Typography variant="body2">Caps Lock is on</Typography>
              </Box>
            )}

            {/* Alerts */}
            {loginError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {loginError}
              </Alert>
            )}
            {loginSuccess && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {loginSuccess}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 2,
                width: "200px",
                backgroundColor: "#132060",
                color: "white",
                fontWeight: "bold",
                alignSelf: "center",
                "&:hover": {
                  backgroundColor: "#57e569",
                },
              }}
            >
              Log In →
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
