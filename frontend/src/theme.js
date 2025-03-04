import { createTheme, ThemeProvider } from '@mui/material/styles';

// Define your custom MUI theme using Bootswatch's colors
const theme = createTheme({
  palette: {
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
      primary: "#ffffff",
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
            color: "#ffffff",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff", // Border color on hover
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff", // Border color on focus
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

export default theme;
