import { useState, useEffect } from 'react';
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Application from "./pages/Application";
import RoleManagement from "./pages/RoleManagement";
import Login from "./pages/login";
import ViewApplication from "./pages/ViewApplication";
import AddApplication from "./pages/AddApplication";
import RegisterUser from "./pages/RegisterUser"; // ✅ Import RegisterUser.js
import { checkSession } from "./utils/authUtils";
import { ThemeProvider, CssBaseline, Button } from '@mui/material';
import { darkTheme, lightTheme } from './theme'; // Import the themes
import Navbar from './components/Navbar'; // Import Navbar


function App({ toggleTheme }) {
  const [atLogin, setAtLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation(); // Hook to get the current location/pathname

  // checking auth every minute
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('This will be called every minute');
      const validateSession = async () => {
        const isValid = await checkSession(); // check if their session is valid
        if (!isValid) {
          window.location.href = "/login";
          sessionStorage.removeItem("session_id");
        }
      };
      validateSession();
    }, 1000 * 120); // 1 second * 120 -> 120 seconds -> every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="d-flex min-vh-100">
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
            <Route path="role-management" element={<ProtectedRoute element={<RoleManagement />} />} />
            <Route path="applications" element={<ProtectedRoute element={<Application />} />} />
            <Route path="/view-application/:id" element={<ProtectedRoute element={<ViewApplication />} />} />
            <Route path="/add-application" element={<ProtectedRoute element={<AddApplication />} />} />
            <Route path="/register-user" element={<ProtectedRoute element={<RegisterUser />} />} /> {/* ✅ New Route */}
            <Route path="login" element={<Login />} />
          </Routes>
        </div>
      </div>
      <Button onClick={toggleTheme} variant="contained" color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        Theme
      </Button>
    </>
  );
}

// Wrap the App component with the Router to provide routing context
export default function WrappedApp() {
  const [isDarkMode, setIsDarkMode] = useState(true); // State to toggle between themes

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline /> {/* This component helps to apply the theme globally */}
      <Router>
        <App toggleTheme={toggleTheme} />
      </Router>
    </ThemeProvider>
  );
}
