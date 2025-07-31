// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
// Import the Toaster
import { Toaster } from "react-hot-toast";
import { registerLocale } from "react-datepicker";
import uz from "date-fns/locale/uz";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// 1. Import the Uzbek locale for dayjs
import "dayjs/locale/uz-latn";

registerLocale("uz", uz);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uz-latn">
      <Router>
        <AuthProvider>
          {/* Add the Toaster component here */}
          <Toaster position="top-center" reverseOrder={false} />
          <App />
        </AuthProvider>
      </Router>
    </LocalizationProvider>
  </React.StrictMode>
);
