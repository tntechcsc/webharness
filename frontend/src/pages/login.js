import React from "react";
import { Box, TextField, Button, Typography, Container, Paper } from "@mui/material";
import axios from "axios";

const Login = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    const baseURL = "http://localhost:3000"; //Backend

    axios
      .post(`${baseURL}/api/user/login`, { username, password })
      .then((response) => {
        console.log("Login successful:", response.data);
        sessionStorage.setItem("session_id", response.data.session_id);
        window.location.href = "/"; // 
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert("Login failed. Please check your credentials.");
      });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(180deg, #1e3c72 50%, white 100%)", // Page Background
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={20}
          sx={{
            position: "relative", // 
            width: "100%",
            p: 4,
            borderRadius: "16px",
            textAlign: "center",
            background: "linear-gradient(135deg, #132060 0%, #1e3c72 100%)",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
            overflow: "hidden", 
            transition: "all 0.3s ease-in-out",
            "&:hover": { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)" },
          }}
        >
            <Box
            sx={{
              position: "absolute",
              width: "100vw",
              height: "100vh",
              backgroundColor: "white",
              opacity: 0.7,
              borderRadius: "50%",
              top: "40%",
             
            }}

          />

          {/* ✅ Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2, position: "relative", zIndex: 1 }}>
            <img src="LogoHarness2.png" alt="Logo" style={{ maxWidth: "150px", maxHeight: "150px" }} />
          </Box>

          {/* ✅ Title */}
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: "bold",
              mb: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            Mangrove
          </Typography>

          {/* ✅ Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, position: "relative", zIndex: 1 }}>
            <TextField
              name="username"
              variant="outlined"
              fullWidth
              required
              size="small"
              placeholder="Username"
              InputLabelProps={{ shrink: false }}
              InputProps={{
                sx: {
                  backgroundColor: "white",
                  borderRadius: "5px",
                  color: "black",
                },
              }}
            />

            <TextField
              name="password"
              type="password"
              variant="outlined"
              fullWidth
              required
              size="small"
              placeholder="Password"
              InputLabelProps={{ shrink: false }}
              InputProps={{
                sx: {
                  backgroundColor: "white",
                  borderRadius: "5px",
                  color: "black",
                },
              }}
            />

            {/* ✅ Login Button */}
            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 1,
                width: "200px", // ✅ Adjust the width here (Change size as needed)
                backgroundColor: "#132060",
                color: "white",
                fontWeight: "bold",
                alignSelf: "center", // ✅ Ensures button stays centered
                "&:hover": { 
                  backgroundColor: "#57e569" 
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
