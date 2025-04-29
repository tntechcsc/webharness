import { useState, useEffect, useContext } from 'react';
import { HashRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom'; //may have to switch to hash router
import HomePage from './pages/HomePage';
import Application from './pages/Application';
import RoleManagement from './pages/RoleManagement';
import Login from './pages/login';
import ViewApplication from './pages/ViewApplication';
import AddApplication from './pages/AddApplication';
import EditApplication from './pages/EditApplication';
import RegisterUser from './pages/RegisterUser'; 
import { checkSession } from './utils/authUtils';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeContext } from './context/themecontext'; 
import { lightTheme, darkTheme, defaultTheme } from './theme';
import Profile from './pages/Profile';
import "intro.js/minified/introjs.min.css";
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [atLogin, setAtLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { mode } = useContext(ThemeContext); 
  const navigate = useNavigate();

  // Checking auth every minute
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('This will be called every minute');
      const validateSession = async () => {
        const isValid = await checkSession(); // Check if their session is valid
        if (!isValid) {
          navigate("login")
          sessionStorage.removeItem("session_id");
        }
      };
      validateSession();
    }, 1000 * 120); // 1 second * 120 -> 120 seconds -> every 2 minutes
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="d-flex min-vh-100 bg-dark text-light">
      <div className="flex-grow-1">
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
          <Route path="role-management" element={<ProtectedRoute element={<RoleManagement />} />} />
          <Route path="applications" element={<ProtectedRoute element={<Application />} />} />
          <Route path="/view-application/:id" element={<ProtectedRoute element={<ViewApplication />} />} /> 
          <Route path="/add-application" element={<ProtectedRoute element={<AddApplication />} />} />
          <Route path="/edit-application/:id" element={<ProtectedRoute element={<EditApplication />} />} />
          <Route path="/register-user" element={<ProtectedRoute element={<RegisterUser />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<ProtectedRoute element={<>404</>} />} />
        </Routes>
      </div>
    </div>
  );
}

// Wrap the App component with the Router and ThemeProvider
export default function WrappedApp() {
  const { mode } = useContext(ThemeContext); // Get the current theme mode (light or dark)
  return (
    <ThemeProvider theme={
      mode === 'dark' ? darkTheme :
      mode === 'light' ? lightTheme :
      defaultTheme
    }>
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  );
}
