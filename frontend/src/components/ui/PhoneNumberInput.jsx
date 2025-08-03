import React from 'react';
import { Controller } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { useSettings } from '../../context/SettingsContext';
import { ThemeProvider } from '@mui/material/styles';
import { getMuiTheme } from '../../theme/muiTheme';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// --- A custom component that bridges react-number-format with MUI's input ---
const NumberFormatCustom = React.forwardRef((props, ref) => {
    const { onChange, ...other } = props;

    return (
        <PatternFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                // We call the onChange from react-hook-form's Controller,
                // passing up the unformatted numeric string (e.g., "901234567").
                onChange({
                    target: {
                        name: props.name,
                        value: values.value,
                    },
                });
            }}
            // Formatting options for the Uzbek phone number
            format="(##) ###-##-##"
            mask="_"
            allowEmptyFormatting
        />
    );
});


const PhoneNumberInput = ({ control, name, label, error }) => {
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
                    <TextField
                        {...field}
                        label={label}
                        variant="outlined"
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        // This is the key to making it a formatted phone input
                        InputProps={{
                            inputComponent: NumberFormatCustom,
                            // --- THIS IS THE FIX for the "+998" prefix ---
                            startAdornment: (
                                <InputAdornment position="start">
                                    +998
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
        </ThemeProvider>
    );
};

export default PhoneNumberInput;