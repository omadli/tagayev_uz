import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";

// Import Layout and Pages
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
// --- THIS IS THE FIX: Import the new TeachersPage ---
import TeachersPage from "./pages/TeachersPage";
import StudentsPage from "./pages/StudentsPage";
import StaffPage from "./pages/StaffPage"; // Assuming this page also exists as planned
import GroupsPage from "./pages/GroupsPage";
import RoomsPage from "./pages/RoomsPage";

// This component protects all routes that require a logged-in user
const PrivateRoute = () => {
  const { user } = useAuth();

  // If the user is authenticated, render the main DashboardLayout.
  // The <Outlet/> inside DashboardLayout will then render the specific child route (e.g., DashboardPage or TeachersPage).
  return user ? (
    <SettingsProvider>
      <DashboardLayout />
    </SettingsProvider>
  ) : (
    // If not authenticated, redirect to the login page
    <Navigate to="/login" />
  );
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* The login page is a public route. If a user is already logged in, redirect them to the dashboard. */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <LoginPage />}
      />

      {/* All dashboard routes are nested under the PrivateRoute. */}
      {/* This ensures that only authenticated users can access them. */}
      <Route path="/" element={<PrivateRoute />}>
        {/* The 'index' route is the default page shown at the root path "/" */}
        <Route index element={<DashboardPage />} />

        {/* --- THIS IS THE FIX: Add the new route for the teachers page --- */}
        <Route path="staff" element={<StaffPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="settings/office/rooms" element={<RoomsPage />} />
        {/* <Route path="leads" element={<LeadsPage />} /> */}
      </Route>

      {/* A fallback route to catch any undefined paths and redirect to the appropriate starting page. */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;
