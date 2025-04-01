import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { lightTheme, darkTheme, defaultTheme } from "../theme"; // ✅ Import all 3

export const ThemeContext = createContext();

export const ThemeProviderComponent = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem("theme") || "default");

  const toggleTheme = () => {
    const nextMode = mode === "light" ? "dark" : mode === "dark" ? "default" : "light";
    setMode(nextMode);
    localStorage.setItem("theme", nextMode);
  };

  const theme = useMemo(() => {
    if (mode === "dark") return darkTheme;
    if (mode === "light") return lightTheme;
    return defaultTheme;
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
