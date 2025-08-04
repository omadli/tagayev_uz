import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (appTheme) => {
  const mode = appTheme === "dark" ? "dark" : "light";

  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
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
            // --- CALENDAR COLORS (DARK) ---
            calendar: {
              lesson: "#15803d40", // bg-green-700 with opacity
              holiday: "#be123c40", // bg-red-700 with opacity
              rescheduledNew: "#2563eb40", // bg-blue-700 with opacity
              rescheduledOld: "#ca8a0440", // bg-yellow-700 with opacity
            },
          }
        : {
            background: {
              default: "#F9FAFB",
              paper: "#FFFFFF",
            },
            // --- CALENDAR COLORS (LIGHT) ---
            calendar: {
              lesson: "#D1FAE5", // bg-green-100
              holiday: "#FEE2E2", // bg-red-100
              rescheduledNew: "#DBEAFE", // bg-blue-100
              rescheduledOld: "#FEF3C7", // bg-yellow-100
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
};
