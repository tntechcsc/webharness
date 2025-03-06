import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export const ThemeContext = createContext();

export const ThemeProviderComponent = ({ children }) => {
    const [mode, setMode] = useState(localStorage.getItem("theme") || "light");

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === "light" ? "dark" : "light";
            localStorage.setItem("theme", newMode);
            return newMode;
        });
    };

    const theme = useMemo(
        () =>
          createTheme({
            palette: {
              mode,
              ...(mode === "dark"
                ? {
                    primary: {
                      main: "#90caf9", // light blue
                    },
                    background: {
                      default: "#121212", // dark grey
                      paper: "#1e1e1e", // dark grey
                    },
                  }
                : {
                    primary: {
                      main: "#1976d2", // dark blue
                    },
                    background: {
                      default: "#fff", // white
                      paper: "#f5f5f5", // light grey
                    },
                  }),
            },
          }),
        [mode]
      );
      

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};