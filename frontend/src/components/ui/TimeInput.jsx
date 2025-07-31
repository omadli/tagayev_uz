import React from "react";
import { Controller } from "react-hook-form";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import dayjs from "dayjs";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Use the same theme as the color input for consistency
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

const TimeInput = ({ control, name, label, error }) => {
  return (
    <ThemeProvider theme={muiTheme}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TimeField
            {...field}
            label={label}
            variant="outlined"
            fullWidth
            // We must use dayjs to manage the value
            value={field.value ? dayjs(field.value, "HH:mm") : null}
            onChange={(newValue) => {
              // Convert the dayjs object back to a simple 'HH:mm' string for our form state
              field.onChange(newValue ? newValue.format("HH:mm") : "");
            }}
            format="HH:mm" // 24-hour format
            // Handle errors
            slotProps={{
              textField: {
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />
    </ThemeProvider>
  );
};

export default TimeInput;
