import React from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ThemeProvider } from '@mui/material/styles';
import { getMuiTheme } from '../../theme/muiTheme'; // Import our shared MUI theme
import { useSettings } from '../../context/SettingsContext';
import dayjs from 'dayjs';

const DateInput = ({ control, name, label, error }) => {
    // Get the current theme to create the correct MUI theme
    const { theme } = useSettings();
    const muiTheme = getMuiTheme(theme);

    return (
        // Wrap the component in the ThemeProvider to apply our custom dark/light styles
        <ThemeProvider theme={muiTheme}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <DatePicker
                        {...field}
                        label={label}
                        // The value must be a dayjs object or null for MUI
                        value={field.value ? dayjs(field.value) : null}
                        // When the value changes, we pass the standard Date object back to react-hook-form
                        onChange={(date) => field.onChange(date ? date.toDate() : null)}
                        // Use our globally configured Uzbek locale and format
                        format="DD/MM/YYYY"
                        // Style the input field using MUI's slotProps
                        slotProps={{
                            textField: {
                                variant: 'outlined',
                                fullWidth: true,
                                error: !!error,
                                helperText: error?.message,
                            },
                            // Add props to the calendar icon if needed
                            openPickerButton: {
                                "aria-label": "open date picker",
                            },
                        }}
                    />
                )}
            />
        </ThemeProvider>
    );
};

export default DateInput;