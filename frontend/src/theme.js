import { createTheme } from '@mui/material/styles';

// Define light theme
const lightTheme = createTheme({
  palette: {
    mode: "light",  // Light theme mode
    primary: {
      main: "#12255f",
    },
    secondary: {
      main: "#12255f",
    },
    background: {
      default: "#ffffff",
      paper: "#f5f5f5",
    },
    text: {
      primary: "#000000", // Black text for light mode
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 600,
      fontSize: "2.25rem",
      color: "#000000",
    },
    h2: {
      fontWeight: 600,
      fontSize: "1.875rem",
      color: "#000000",
    },
    // Other typography styles remain the same...
  },
  components: {
    // Same button, input, and pagination styles as before...
  },
});

// Define dark theme
const darkTheme = createTheme({
  palette: {
    mode: "light",  // Dark theme mode, it is labeled "light" because "dark" messes with the navbar colors
    primary: {
      main: "#12255f",
    },
    secondary: {
      main: "#12255f",
    },
    background: {
      default: "#121212",
      paper: "#1d1d1d",
    },
    text: {
      primary: "#ffffff", // White text for dark mode
      secondary: "#b0b0b0",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 600,
      fontSize: "2.25rem",
      color: "#ffffff",
    },
    h2: {
      fontWeight: 600,
      fontSize: "1.875rem",
      color: "#ffffff",
    },
    // Other typography styles remain the same...
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#12255f", // Dark blue
          boxShadow: "none", // No shadow
        },
      },
    },
  },
});

export { lightTheme, darkTheme };
