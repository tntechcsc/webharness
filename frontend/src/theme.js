import { createTheme, ThemeProvider } from '@mui/material/styles';

// Define your custom MUI theme using Bootswatch's colors
const theme = createTheme({
    palette: {
      mode: "dark", // Slate is a dark theme
      primary: {
        main: "#5A6268", // Muted slate grayish-blue (primary accent)
      },
      secondary: {
        main: "#495057", // Dark gray for secondary elements
      },
      background: {
        default: "#343a40", // Dark background color, close to Slate's main background
        paper: "#495057", // Slightly lighter gray for paper/card elements
      },
      text: {
        primary: "#f8f9fa", // Light text color for better contrast
        secondary: "#adb5bd", // Subtle, muted secondary text
      },
    },
    typography: {
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: {
        fontWeight: 600,
        fontSize: "2.25rem",
      },
      h2: {
        fontWeight: 600,
        fontSize: "1.875rem",
      },
      h3: {
        fontWeight: 500,
        fontSize: "1.5rem",
      },
      h4: {
        fontWeight: 500,
        fontSize: "1.25rem",
      },
      h5: {
        fontWeight: 400,
        fontSize: "1.125rem",
      },
      h6: {
        fontWeight: 400,
        fontSize: "1rem",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none", // Normal text case (no all-caps)
            borderRadius: 8, // Rounded buttons
            padding: "8px 16px", // Padding for buttons
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12, // Rounded card corners
            backgroundColor: "#495057", // Slightly lighter gray for cards
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: "#5A6268", // Muted slate blue for the app bar
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontWeight: 600,
            color: "#f8f9fa", // Light text for headings
          },
          h2: {
            fontWeight: 600,
            color: "#f8f9fa",
          },
          h3: {
            fontWeight: 600,
            color: "#f8f9fa",
          },
          h4: {
            fontWeight: 500,
            color: "#f8f9fa",
          },
        },
      },
    },
  });

export default theme;
