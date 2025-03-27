import { createTheme } from '@mui/material/styles';

// Define light theme
const lightTheme = createTheme({
  palette: {
    mode: "light",  // Light theme mode
    primary: {
      main: "#12255f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#12255f",
    },
    background: {
      default: "#ffffff",
      paper: "#f5f5f5",
      banner: "#0A192F"
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
    h3: {
      fontWeight: 500,
      fontSize: "1.5rem",
      color: "#000000",
    },
    h4: {
      fontWeight: 500,
      fontSize: "1.25rem",
      color: "#000000",
    },
    h5: {
      fontWeight: 400,
      fontSize: "1.125rem",
      color: "#ffffff",
    },
    h6: {
      fontWeight: 400,
      fontSize: "1rem",
      color: "#000000",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#75ea81", // Default button background
          textColor: "#12255f", // Default text/icon color
          padding: "2px 0px", // Custom padding
          fontWeight: "bold", // Button text bold
          "&:hover": {
            backgroundColor: "#5fcf69", // Slightly darker on hover
          },
        },
        contained: {
          backgroundColor: "#75ea81", // Ensures consistency for contained buttons
          color: "#12255f", // Default text/icon color
          fontWeight: "bold", // Button text bold
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#12255f", // Default icon button color
          "&:hover": {
            color: "#0d1d4d", // Darker on hover
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#000000",
          },
          "& .MuiInputLabel-root": {
            color: "#000000", // Default label color
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#000000", // Default border color
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81", // Border color on hover
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81", // Border color on focus
          },
          // Label color change on focus
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#75ea81", // Color of the label when input is focused
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        selectIcon: {
          color: '#ffffff', // This will change the color of the page select dropdown icon
        },
        navigation: {
          '& .MuiPaginationItem-previousNext': {
            color: '#ffffff', // This changes the color of the previous/next page arrows
          },
        },
      },
    },
  },
});


const defaultTheme = createTheme({                            // Default
  palette: {
    mode: "light",
    primary: {
      main: "#12255f", 
    },
    secondary: {
      main: "#12255f", 
    },
    background: {
      default: "#1e3c72", 
      paper: "#ffffff",  
      banner: "#0A192F"
    },
    text: {
      primary: "#0b3d2e",
      secondary: "#4a5f56",
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    h1: { fontWeight: 600, fontSize: "2.25rem" },
    h2: { fontWeight: 600, fontSize: "1.875rem" },
    h3: { fontWeight: 500, fontSize: "1.5rem" },
    h4: { fontWeight: 500, fontSize: "1.25rem" },
    h5: { fontWeight: 400, fontSize: "1.125rem" },
    h6: { fontWeight: 400, fontSize: "1rem" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#37966f",
          color: "#ffffff",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#2e7d5b",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "12px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#356859",
        },
      },
    },
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
      banner: "#0A192F"
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
    h3: {
      fontWeight: 500,
      fontSize: "1.5rem",
      color: "#ffffff",
    },
    h4: {
      fontWeight: 500,
      fontSize: "1.25rem",
      color: "#ffffff",
    },
    h5: {
      fontWeight: 400,
      fontSize: "1.125rem",
      color: "#ffffff",
    },
    h6: {
      fontWeight: 400,
      fontSize: "1rem",
      color: "#ffffff",
    },
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
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#75ea81", // Default button background
          textColor: "#12255f", // Default text/icon color
          padding: "2px 0px", // Custom padding
          fontWeight: "bold", // Button text bold
          "&:hover": {
            backgroundColor: "#5fcf69", // Slightly darker on hover
          },
        },
        contained: {
          backgroundColor: "#75ea81", // Ensures consistency for contained buttons
          color: "#12255f", // Default text/icon color
          fontWeight: "bold", // Button text bold
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#12255f", // Default icon button color
          "&:hover": {
            color: "#0d1d4d", // Darker on hover
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#ffffff",
          },
          "& .MuiInputLabel-root": {
            color: "#ffffff", // Default label color
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff", // Default border color
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81", // Border color on hover
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81", // Border color on focus
          },
          // Label color change on focus
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#75ea81", // Color of the label when input is focused
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        selectIcon: {
          color: '#ffffff', // This will change the color of the page select dropdown icon
        },
        navigation: {
          '& .MuiPaginationItem-previousNext': {
            color: '#ffffff', // This changes the color of the previous/next page arrows
          },
        },
      },
    },
  },
});

export { lightTheme, darkTheme, defaultTheme };
