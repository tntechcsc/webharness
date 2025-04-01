import { createTheme } from '@mui/material/styles';

// Define light theme
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ffffff",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#12255f",
    },

    tertiary: { 
      main: "#f5f5f5" 
    }, 
    background: {
      default: "#cccccc",
      paper: "#f5f5f5",
      banner: "#0A192F"
    },
    text: {
      primary: "#000000",
      secondary: "#666666",
    },
  },

  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 600, fontSize: "2.25rem", color: "#000000" },
    h2: { fontWeight: 600, fontSize: "1.875rem", color: "#000000" },
    h3: { fontWeight: 500, fontSize: "1.5rem", color: "#000000" },
    h4: { fontWeight: 500, fontSize: "1.25rem", color: "#000000" },
    h5: { fontWeight: 400, fontSize: "1.125rem", color: "#ffffff" },
    h6: { fontWeight: 400, fontSize: "1rem", color: "#000000" },
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#132060", // Card body color
          borderRadius: "12px",
          boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#75ea81",
          textColor: "#12255f",
          padding: "2px 0px",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#5fcf69",
          },
        },
        contained: {
          backgroundColor: "#75ea81",
          color: "#12255f",
          fontWeight: "bold",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#12255f",
          "&:hover": {
            color: "#0d1d4d",
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
            color: "#000000",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#000000",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#75ea81",
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        selectIcon: {
          color: '#ffffff',
        },
        navigation: {
          '& .MuiPaginationItem-previousNext': {
            color: '#ffffff',
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
      main: "#6ffb78", 
    },

    tertiary: { 
      main: "#12255f" 
    }, 
    background: {
      default: "#ffffff", 
      paper: "#ffffff",  
      banner: "#0A192F"
    },
    text: {
      primary: "#0b3d2e",
      secondary: "#4a5f56",
    },
    
  },

  custom: {
    gradients: {
      homeBackground: "linear-gradient(180deg, #1e3c72 50%, #e9ecf1 100%)",
    },
  },

  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    h1: { fontWeight: 600, fontSize: "2.25rem" },
    h2: { fontWeight: 600, fontSize: "1.875rem" },
    h3: { fontWeight: 500, fontSize: "1.5rem" },
    h4: { fontWeight: 500, fontSize: "1.25rem" },
    h5: { fontWeight: 400, fontSize: "1.125rem", color: "#ffffff" },
    h6: { fontWeight: 400, fontSize: "1rem", color: "#ffffff" },
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
          backgroundColor: "#132060",
          borderRadius: "12px",
          boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)", // ✅ Add shadow
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)", // ✅ Optional hover effect
          },
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
            borderColor: "#75ea81",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#75ea81",
          },
        },
      },
    },
  },
});



// Define dark theme
const darkTheme = createTheme({
  palette: {
    mode: "light", // Intentional override due to navbar compatibility
    primary: {
      main: "#2a2a2a",
    },
    secondary: {
      main: "#ffffff",
    },


    tertiary: { 
      main: "#1d1d1d" ,
    }, 
    
    background: {
      default: "#121212",
      paper: "#1d1d1d",
      banner: "#0A192F",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 600, fontSize: "2.25rem", color: "#ffffff" },
    h2: { fontWeight: 600, fontSize: "1.875rem", color: "#ffffff" },
    h3: { fontWeight: 500, fontSize: "1.5rem", color: "#ffffff" },
    h4: { fontWeight: 500, fontSize: "1.25rem", color: "#ffffff" },
    h5: { fontWeight: 400, fontSize: "1.125rem", color: "#ffffff" },
    h6: { fontWeight: 400, fontSize: "1rem", color: "#ffffff" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#12255f",
          boxShadow: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#75ea81",
          textColor: "#12255f",
          padding: "2px 0px",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#5fcf69",
          },
        },
        contained: {
          backgroundColor: "#75ea81",
          color: "#12255f",
          fontWeight: "bold",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#12255f",
          "&:hover": {
            color: "#0d1d4d",
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
            borderColor: "#75ea81",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#75ea81",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#75ea81",
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        selectIcon: {
          color: "#ffffff",
        },
        navigation: {
          '& .MuiPaginationItem-previousNext': {
            color: "#ffffff",
          },
        },
      },
    },
    // ✅ Add shadow styles for Card in dark mode
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1d1d1d",
          borderRadius: "12px",
          boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)",
          },
        },
      },
    },
  },
});

export { lightTheme, darkTheme, defaultTheme };
