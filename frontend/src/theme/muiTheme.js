import { createTheme } from "@mui/material/styles";

// This function creates the appropriate MUI theme based on the mode ('light' or 'dark')
export const getMuiTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            // --- DARK MODE PALETTE ---
            background: {
              default: "#1A2238", // dark-primary
              paper: "#222E4E", // dark-secondary
            },
            text: {
              primary: "#F2F2F2",
              secondary: "#A6B0CF",
            },
            action: {
              active: "#A6B0CF",
            },
            divider: "#2F3B60",
          }
        : {
            // --- LIGHT MODE PALETTE ---
            background: {
              default: "#F9FAFB",
              paper: "#FFFFFF",
            },
          }),
    },
    components: {
      // Style overrides for all components
      MuiTextField: {
        styleOverrides: {
          root: { "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" } },
        },
      },
      MuiSelect: {
        styleOverrides: { root: { borderRadius: "0.75rem" } },
      },
      // ... add other component overrides as needed
    },
  });
