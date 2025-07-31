import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navLinks } from "../../data/navigation";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import clsx from "clsx";
import { Tooltip } from "react-tooltip";

const NavItem = ({ item, isCollapsed, level = 0 }) => {
  const { pathname } = useLocation();

  const isChildActive = (item) => {
    if (!item.children) return false;
    return item.children.some(
      (child) => pathname.startsWith(child.path) || isChildActive(child)
    );
  };

  const isParentOfActiveLink = isChildActive(item);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(isParentOfActiveLink);

  const linkClasses =
    "flex items-center justify-between w-full py-2.5 text-base font-medium text-left rounded-lg transition-colors";
  const activeClasses = "active-link bg-blue-600 text-white";
  const inactiveClasses =
    "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
  const mixedThemeInactive =
    "theme-mixed:text-gray-300 theme-mixed:hover:bg-gray-700 theme-mixed:hover:text-white";

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
          style={{ paddingLeft: `${12 + level * 24}px` }}
          className={clsx(
            linkClasses,
            isParentOfActiveLink
              ? "text-blue-600 dark:text-blue-400"
              : inactiveClasses,
            mixedThemeInactive
          )}
        >
          <div className="flex items-center">
            <item.icon className="mr-3 flex-shrink-0" size={20} />
            {/* Hide text when the sidebar is collapsed */}
            <span
              className={clsx(
                "transition-opacity",
                isCollapsed ? "opacity-0" : "opacity-100"
              )}
            >
              {item.name}
            </span>
          </div>
          <FiChevronRight
            className={clsx(
              "transition-transform flex-shrink-0",
              { "rotate-90": isSubMenuOpen },
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
          />
        </button>

        {/* Conditionally render the nested children */}
        {isSubMenuOpen && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {/* --- RECURSION HAPPENS HERE --- */}
            {/* The component renders its own children, passing an incremented level. */}
            {item.children.map((child) => (
              <NavItem
                key={child.name}
                item={child}
                isCollapsed={isCollapsed}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER LOGIC FOR ITEMS WITHOUT CHILDREN (A SIMPLE LINK) ---
  return (
    <NavLink
      to={item.path}
      style={{ paddingLeft: `${12 + level * 24}px` }}
      className={({ isActive }) =>
        clsx(
          linkClasses,
          isActive ? activeClasses : [inactiveClasses, mixedThemeInactive]
        )
      }
    >
      <div className="flex items-center">
        <item.icon className="mr-3 flex-shrink-0" size={20} />
        <span
          className={clsx(
            "transition-opacity",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}
        >
          {item.name}
        </span>
      </div>
    </NavLink>
  );
};

// This is the main Sidebar component
const DashboardSidebar = ({ isCollapsed, toggleCollapse }) => {
  return (
    <aside
      className={clsx(
        "sidebar h-screen bg-white dark:bg-gray-800 flex flex-col border-r border-gray-100 dark:border-gray-700 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Top section with Logo and the Collapse button */}
      <div className="p-4 h-[68px] flex-shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-9 h-9 mr-3 rounded-md object-cover"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Tagayev.uz
            </h1>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FiChevronLeft
            className={clsx("transition-transform", {
              "rotate-180": isCollapsed,
            })}
          />
        </button>
      </div>

      {/* The scrollable navigation area */}
      <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => (
          <NavItem key={link.name} item={link} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* The Tooltip component for collapsed icons */}
      <Tooltip id="nav-tooltip" place="right" effect="solid" className="z-50" />
    </aside>
  );
};

export default DashboardSidebar;
