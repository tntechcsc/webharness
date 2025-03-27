import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export const ThemeContext = createContext();

export const ThemeProviderComponent = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem("theme") || "default");

  const toggleTheme = () => {
    const nextMode =
      mode === "light" ? "dark" :
      mode === "dark" ? "default" :
      "light";

    localStorage.setItem("theme", nextMode);
    setMode(nextMode);
  };

  const theme = useMemo(() => {
    switch (mode) {
      case "dark":
        return createTheme({
          palette: {
            mode: "dark",
            primary: { main: "#90caf9" },
            background: {
              default: "#121212",
              paper: "#1e1e1e",
            },
          },
        });
      case "light":
        return createTheme({
          palette: {
            mode: "light",
            primary: { main: "#1976d2" },
            background: {
              default: "#ffffff",
              paper: "#f5f5f5",
            },
          },
        });
      case "default":
      default:
        return createTheme({
          palette: {
            mode: "light",
            primary: { main: "#356859" },
            secondary: { main: "#37966f" },
            background: {
              default: "linear-gradient(180deg, #1e3c72 50%, #e9ecf1 100%",
              paper: "#ffffff",
            },
            text: {
              primary: "#0b3d2e",
              secondary: "#4a5f56",
            },
          },
          typography: {
            fontFamily: "'Poppins', 'Roboto', sans-serif",
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
            MuiAppBar: {
              styleOverrides: {
                root: {
                  backgroundColor: "#356859",
                },
              },
            },
          },
        });
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
