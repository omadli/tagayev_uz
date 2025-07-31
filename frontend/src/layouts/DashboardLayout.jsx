import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import useWindowSize from "../hooks/useWindowSize";
import clsx from "clsx";

// Import all child components
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import SettingsSidebar from "../components/dashboard/SettingsSidebar";
import AiBotModal from "../components/dashboard/AiBotModal";
import ScrollToTopButton from "../components/dashboard/ScrollToTopButton";
import ProfileSettingsModal from "../components/dashboard/ProfileSettingsModal";
import DraggableAiButton from "../components/dashboard/DraggableAiButton";
import { FiSettings } from "react-icons/fi";
import { Tooltip } from "react-tooltip";
import AddPaymentModal from "../components/finance/AddPaymentModal";

const DashboardLayout = () => {
  // --- THIS IS THE FIX: Get state from the global context ---
  // The layout component no longer manages 'branches' or 'selectedBranchId' state.
  const { menuPosition, layoutWidth } = useSettings();

  const { width } = useWindowSize();
  const isMobile = width < 1024;

  // Local state for modals and sidebar visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAiBotOpen, setIsAiBotOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Functions to toggle state
  const toggleMobileSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleCollapse = () => setIsSidebarCollapsed((prev) => !prev);

  // Effect to handle sidebar state on screen resize
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false); // Always start closed on mobile
    } else {
      setIsSidebarOpen(true); // Always "open" on desktop
    }
  }, [isMobile]);

  // Determine if the vertical menu layout should be shown
  const showVerticalMenu = menuPosition === "vertical" || isMobile;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex min-h-screen">
      {/* The Vertical Sidebar */}
      {showVerticalMenu && (
        <>
          {/* Mobile-only overlay */}
          {isMobile && isSidebarOpen && (
            <div
              onClick={toggleMobileSidebar}
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            ></div>
          )}
          {/* The Sidebar container */}
          <div
            className={clsx(
              "fixed lg:static top-0 left-0 h-full z-40",
              isMobile
                ? isSidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
                : ""
            )}
          >
            <DashboardSidebar
              isCollapsed={!isMobile && isSidebarCollapsed}
              toggleCollapse={toggleCollapse}
            />
          </div>
        </>
      )}

      {/* The Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          onProfileSettingsClick={() => setIsProfileSettingsOpen(true)}
          toggleMobileSidebar={toggleMobileSidebar}
          onAddPaymentClick={() => setIsPaymentModalOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 w-full">
          <div
            className={clsx("w-full", {
              "max-w-screen-2xl mx-auto": layoutWidth === "contained",
            })}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* --- ALL FLOATING AND MODAL UI ELEMENTS --- */}

      {/* 1. Tooltips (global components) */}
      <Tooltip
        id="stat-card-tooltip"
        place="bottom"
        effect="solid"
        className="z-50 max-w-xs"
      />
      <Tooltip id="nav-tooltip" place="right" effect="solid" className="z-50" />

      {/* 2. Floating Action Buttons */}
      <ScrollToTopButton />
      <DraggableAiButton onClick={() => setIsAiBotOpen(true)} />
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition"
          aria-label="Open Settings"
        >
          <FiSettings size={24} />
        </button>
      </div>

      {/* 3. Sidebars and Modals (highest z-index) */}
      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AiBotModal isOpen={isAiBotOpen} onClose={() => setIsAiBotOpen(false)} />
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
