import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLogOut, FiSettings, FiVideo, FiUser } from "react-icons/fi";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { StyledBadge, stringAvatar } from "../ui/Avatar";
import { Avatar } from "@mui/material";

const ProfileDropdown = ({ onSettingsClick }) => {
  // ... (keep the existing state and useEffect hooks)
  const { user, logoutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center"
      >
        {user.profile_photo ? (
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
          >
            <Avatar alt={user.full_name} src={user.profile_photo} />
          </StyledBadge>
        ) : (
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
          >
            <Avatar {...stringAvatar(user.full_name)} />
          </StyledBadge>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 animate-fade-in-down border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700 flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {user.profile_photo ? (
                <Avatar alt={user.full_name} src={user.profile_photo} sx={{ width: 56, height: 56 }} />
              ) : (
                <Avatar {...stringAvatar(user.full_name)} sx={{ width: 56, height: 56 }} />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user.full_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {user.roles.join(", ").toLowerCase()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  +{user.phone_number}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                <QrCodeIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {/* --- FIX: This button now correctly calls the function from the layout --- */}
            <button
              onClick={onSettingsClick}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <FiSettings className="mr-3" /> Profile Sozlamalari
            </button>
            <button
              onClick={logoutUser}
              className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md"
            >
              <FiLogOut className="mr-3" /> Chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
