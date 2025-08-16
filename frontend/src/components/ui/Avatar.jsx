import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";

function stringToColor(string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function stringAvatar(name, sx = {}) {
  // Defensive check for a valid name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { sx }; // Return empty sx if name is invalid
  }
  
  const nameParts = name.split(" ");
  const initials = 
      nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`
      : `${name.charAt(0)}`;
      
  return {
    // We now merge the base styles with any additional sx props passed in.
    sx: {
      bgcolor: stringToColor(name),
      // Add other base styles here, like font size
      fontSize: '1.5rem', // Default font size for the initials
      ...sx, // The additional styles (like width and height) are applied here
    },
    children: initials.toUpperCase(),
  };
}

export const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));
