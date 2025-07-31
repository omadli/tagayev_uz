import React from "react";
import { Controller } from "react-hook-form";
import { MuiColorInput } from "mui-color-input";
import { ThemeProvider, createTheme } from "@mui/material/styles"; // To style the component

// Our custom color palette with Uzbek labels
const customPalette = [
  { name: "Oq", value: "#FFFFFF" },
  { name: "Qora", value: "#000000" },
  { name: "Kulrang", value: "#6B7280" },
  { name: "Sariq", value: "#F59E0B" },
  { name: "Qizil", value: "#EF4444" },
  { name: "Yashil", value: "#10B981" },
  { name: "Ko'k", value: "#3B82F6" },
];

// A minimal MUI theme to make the input match our design
const muiTheme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "0.5rem",
          },
        },
      },
    },
  },
});

const ColorInput = ({ control, name, label, error }) => {
  return (
    <ThemeProvider theme={muiTheme}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <MuiColorInput
            {...field}
            label={label}
            variant="outlined"
            format="hex"
            // Provide the custom palette
            swatches={customPalette.map((c) => c.value)}
            // This is a prop to get the custom names, but mui-color-input might not support it directly.
            // The title/tooltip would appear on the swatch hover.
            // For simplicity, we'll rely on the visual color.
            fullWidth
            error={!!error}
            helperText={error?.message}
          />
        )}
      />
    </ThemeProvider>
  );
};

export default ColorInput;
