import React, { forwardRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ThemeProvider } from '@mui/material/styles';
import { getMuiTheme } from '../../theme/muiTheme';
import TextField from '@mui/material/TextField';

// We use forwardRef to allow react-hook-form's 'register' function
// to pass its ref down to the underlying MUI TextField.
const Input = forwardRef((props, ref) => {
    const { theme } = useSettings();
    const muiTheme = getMuiTheme(theme);
    const { error, ...rest } = props;

    return (
        <ThemeProvider theme={muiTheme}>
            <TextField
                // --- THIS IS THE KEY FIX ---
                // We pass the ref from forwardRef directly to the inputRef prop of TextField.
                // We spread the rest of the props (onChange, onBlur, name) from register().
                inputRef={ref}
                variant="outlined"
                fullWidth
                // Error handling props
                error={!!error}
                helperText={error?.message}
                {...rest} // Spread the remaining props (label, type, etc.)
            />
        </ThemeProvider>
    );
});

export default Input;