import React from "react";
import { FiSearch, FiBell, FiMenu } from "react-icons/fi";
import { useSettings } from "../../context/SettingsContext";
import useWindowSize from "../../hooks/useWindowSize";
import clsx from "clsx";

// Import child components
import ProfileDropdown from "./ProfileDropdown";
import HeaderSearch from "./HeaderSearch";
import HorizontalNav from "./HorizontalNav";
import BranchChanger from "./BranchChanger";

const DashboardHeader = ({
  toggleMobileSidebar,
  onProfileSettingsClick,
  onAddPaymentClick,
}) => {
  // Get all necessary state and props
  const { menuPosition } = useSettings();
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  // --- LAYOUT LOGIC 1: HORIZONTAL MENU ---
  // If the setting is 'horizontal' AND we are not on a mobile screen, render this layout.
  if (menuPosition === "horizontal" && !isMobile) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        {/* Top Row: Logo, Search, and User Actions */}
        <div className="w-full">
          <div className="flex items-center justify-between p-4 h-[68px] max-w-screen-2xl mx-auto">
            <div className="flex items-center space-x-4">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-9 h-9 rounded-md object-cover"
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Tagayev.uz
              </h1>
            </div>
            <div className="flex-1 flex justify-center px-8">
              <HeaderSearch />
            </div>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={onAddPaymentClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                TO'LOV
              </button>
              <BranchChanger />
              <button
                className="text-gray-500 relative"
                aria-label="Notifications"
              >
                <FiBell size={22} />
              </button>
              <ProfileDropdown onSettingsClick={onProfileSettingsClick} />
            </div>
          </div>
        </div>
        {/* Bottom Row: The actual navigation links */}
        <HorizontalNav />
      </header>
    );
  }

  // --- LAYOUT LOGIC 2: VERTICAL MENU & MOBILE ---
  // This is the default layout for all other cases (vertical menu on desktop, or any view on mobile)
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
      {/* Mobile-only Layout */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between p-4 h-[68px] max-w-screen-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMobileSidebar}
              className="text-gray-500 dark:text-gray-400"
            >
              <FiMenu size={24} />
            </button>
            <BranchChanger />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddPaymentClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              TO'LOV
            </button>
            <button
              className="bg-blue-600 text-white p-2 rounded-lg"
              aria-label="Payment"
            >
              <FiBell size={20} />
            </button>
            <ProfileDropdown onSettingsClick={onProfileSettingsClick} />
          </div>
        </div>
        <div className="px-4 pb-4">
          <HeaderSearch />
        </div>
      </div>

      {/* Desktop Layout (when menu is vertical) */}
      <div className="hidden lg:flex items-center justify-between p-4 h-[68px] max-w-screen-2xl mx-auto">
        <div className="flex-1">
          {/* This is intentionally empty to push the search bar to the center */}
        </div>
        <div className="flex-1 flex justify-center px-4">
          <HeaderSearch />
        </div>
        <div className="flex-1 flex items-center space-x-2">
          <button
            onClick={onAddPaymentClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            TO'LOV
          </button>
          <BranchChanger />
          <button className="text-gray-500 relative" aria-label="Notifications">
            <FiBell size={22} />
          </button>
          <ProfileDropdown onSettingsClick={onProfileSettingsClick} />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
