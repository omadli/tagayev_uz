import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
// Import Layout and Pages
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
// --- THIS IS THE FIX: Import the new TeachersPage ---
import TeachersPage from "./pages/TeachersPage";
import StudentsPage from "./pages/StudentsPage";
import MyStudentsPage from "./pages/MyStudentsPage";
import StaffPage from "./pages/StaffPage"; // Assuming this page also exists as planned
import GroupsPage from "./pages/GroupsPage";
import MyGroupsPage from "./pages/MyGroupsPage";
import RoomsPage from "./pages/RoomsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import MyGroupDetailPage from "./pages/MyGroupDetailPage";

// This component protects all routes that require a logged-in user
const PrivateRoute = () => {
  const { user } = useAuth();

  // If the user is authenticated, render the main DashboardLayout.
  // The <Outlet/> inside DashboardLayout will then render the specific child route (e.g., DashboardPage or TeachersPage).
  return user ? <DashboardLayout /> : <Navigate to="/login" />;
};

function App() {
  const { user } = useAuth();

  return (
    <SettingsProvider>
      <Routes>
        {/* The login page is a public route. If a user is already logged in, redirect them to the dashboard. */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage />}
        />

        {/* All dashboard routes are nested under the PrivateRoute. */}
        {/* This ensures that only authenticated users can access them. */}
        <Route path="/" element={<PrivateRoute />}>
          {/* --- Public route within the app (all logged-in users can see) --- */}

          {/* Route for Teachers */}
          <Route element={<RoleBasedRoute allowedRoles={["Teacher"]} />}>
            <Route path="mygroups" element={<MyGroupsPage />} />
            <Route path="my-students" element={<MyStudentsPage />} />
            <Route path="mygroups/:groupId" element={<MyGroupDetailPage />} />
          </Route>

          {/* --- Admin & CEO Only Routes --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Admin", "CEO"]} />}>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          </Route>

          {/* --- CEO Only Routes --- */}
          <Route element={<RoleBasedRoute allowedRoles={["CEO"]} />}>
            <Route path="staff" element={<StaffPage />} />
            <Route path="settings/office/rooms" element={<RoomsPage />} />
            {/* Add other CEO-only settings pages here */}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </SettingsProvider>
  );
}

export default App;
