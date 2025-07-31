import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem("authTokens")
      ? jwtDecode(JSON.parse(localStorage.getItem("authTokens")).access)
      : null
  );

  const navigate = useNavigate();

  const loginUser = async (phone_number, password) => {
    try {
      const response = await api.post("/users/login/", {
        phone_number: phone_number.replace(/\D/g, ""), // Remove all non-digit characters
        password,
      });
      const data = response.data;
      setAuthTokens(data);
      // The user info is now decoded from the token itself
      setUser(jwtDecode(data.access));
      localStorage.setItem("authTokens", JSON.stringify(data));
      navigate("/dashboard"); // Redirect to dashboard on successful login
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Let the component handle the error display
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/login"); // Redirect to login on logout
  };

  const updateUserState = (newUserData) => {
    setUser((prevUser) => ({
      ...prevUser, // Keep old data like roles, user_id, etc.
      ...newUserData, // Overwrite with new data (full_name, profile_photo)
    }));
  };

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    updateUserState,
  };

  // This effect can be expanded to handle token refreshing
  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode(authTokens.access));
    }
  }, [authTokens]);

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};
