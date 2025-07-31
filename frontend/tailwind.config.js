/** @type {import('tailwindcss').Config} */
export default {
  // This is the core instruction for class-based theming
  darkMode: "class",

  // Tell Tailwind where to find your class names
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        "dark-primary": "#1A2238", // Main background
        "dark-secondary": "#222E4E", // Card, Modal, Sidebar backgrounds
        "dark-tertiary": "#2F3B60", // Borders, input fields
        "dark-accent": "#4A598C", // Hover states, subtle highlights
        "text-light-primary": "#F2F2F2", // Primary text in dark mode
        "text-light-secondary": "#A6B0CF", // Secondary text in dark mode
      },
    },
  },

  plugins: [],
};
