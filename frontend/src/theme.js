import { createTheme } from '@mui/material/styles';

// Define your dark theme
const darkTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#12255f", // Muted slate grayish-blue (primary accent)
    },
    secondary: {
      main: "#495057", // Dark gray for secondary elements
    },
    background: {
      default: "#2c2f33", // Dark background color, close to Slate's main background
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
      color: "#f8f9fa", // Light text for headings
    },
    h2: {
      fontWeight: 600,
      fontSize: "1.875rem",
      color: "#f8f9fa",
    },
    h3: {
      fontWeight: 500,
      fontSize: "1.5rem",
      color: "#f8f9fa",
    },
    h4: {
      fontWeight: 500,
      fontSize: "1.25rem",
      color: "#f8f9fa",
    },
    h5: {
      fontWeight: 400,
      fontSize: "1.125rem",
      color: "#f8f9fa",
    },
    h6: {
      fontWeight: 400,
      fontSize: "1rem",
      color: "#f8f9fa",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Normal text case (no all-caps)
          borderRadius: 8, // Rounded buttons
          padding: "8px 16px", // Padding for buttons
          "&:hover": {
            backgroundColor: "#6c757d", // Muted color on hover
          },
          "&:active": {
            backgroundColor: "#5a6268", // Darker shade when pressed
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Rounded card corners
          backgroundColor: "#495057", // Slightly lighter gray for cards
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
          "&:hover": {
            boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)", // Slightly deeper shadow on hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#12255f", // Muted slate blue for the app bar
          boxShadow: "none", // Remove default shadow
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
        h5: {
          fontWeight: 400,
          color: "#f8f9fa",
        },
        h6: {
          fontWeight: 400,
          color: "#f8f9fa",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#f8f9fa", // Set text color to white for input fields
          },
          "& .MuiInputLabel-root": {
            color: "#adb5bd", // Muted color for labels
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#adb5bd", // Border color for input fields
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6c757d", // Focused state border color
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#f8f9fa", // Set icon button color to white
        },
      },
    },
  },
});

// Define your light theme
const lightTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#12255f", // Muted slate grayish-blue (primary accent)
    },
    secondary: {
      main: "#495057", // Dark gray for secondary elements
    },
    background: {
      default: "#e0e0e0", // Light background color
      paper: "#f8f9fa", // Slightly darker gray for paper/card elements
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
      color: "#f8f9fa", // Light text for headings
    },
    h2: {
      fontWeight: 600,
      fontSize: "1.875rem",
      color: "#f8f9fa",
    },
    h3: {
      fontWeight: 500,
      fontSize: "1.5rem",
      color: "#f8f9fa",
    },
    h4: {
      fontWeight: 500,
      fontSize: "1.25rem",
      color: "#f8f9fa",
    },
    h5: {
      fontWeight: 400,
      fontSize: "1.125rem",
      color: "#f8f9fa",
    },
    h6: {
      fontWeight: 400,
      fontSize: "1rem",
      color: "#f8f9fa",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Normal text case (no all-caps)
          borderRadius: 8, // Rounded buttons
          padding: "8px 16px", // Padding for buttons
          "&:hover": {
            backgroundColor: "#adb5bd", // Muted color on hover
          },
          "&:active": {
            backgroundColor: "#6c757d", // Darker shade when pressed
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Rounded card corners
          backgroundColor: "#f8f9fa", // Slightly darker gray for cards
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
          "&:hover": {
            boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)", // Slightly deeper shadow on hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#12255f", // Muted slate blue for the app bar
          boxShadow: "none", // Remove default shadow
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
        h5: {
          fontWeight: 400,
          color: "#f8f9fa",
        },
        h6: {
          fontWeight: 400,
          color: "#f8f9fa",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#f8f9fa", // Set text color to white for input fields
          },
          "& .MuiInputLabel-root": {
            color: "#adb5bd", // Muted color for labels
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#adb5bd", // Border color for input fields
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6c757d", // Focused state border color
          },
        },
      },
    },
  },
});

export { lightTheme, darkTheme };
