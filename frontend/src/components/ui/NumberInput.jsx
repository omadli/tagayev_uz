import React from 'react';
import { Controller } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { useSettings } from '../../context/SettingsContext';
import { ThemeProvider } from '@mui/material/styles';
import { getMuiTheme } from '../../theme/muiTheme';
import TextField from '@mui/material/TextField';

// --- A custom component that bridges react-number-format with MUI's input ---
const NumberFormatCustom = React.forwardRef((props, ref) => {
    const { onChange, ...other } = props;

    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                // We call the onChange from react-hook-form's Controller,
                // passing up the unformatted numeric value.
                onChange({
                    target: {
                        name: props.name,
                        value: values.value, // Send the raw numeric string
                    },
                });
            }}
            // Formatting options
            thousandSeparator=" "
            valueIsNumericString
        />
    );
});


const NumberInput = ({ control, name, label, error, ...props }) => {
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
                        // This is the key to making it a formatted number input
                        InputProps={{
                            inputComponent: NumberFormatCustom,
                            // Pass any extra props (like 'suffix') down to the NumberFormatCustom component
                            inputProps: { ...props }
                        }}
                    />
                )}
            />
        </ThemeProvider>
    );
};

export default NumberInput;