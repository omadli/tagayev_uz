import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navLinks } from "../../data/navigation";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import clsx from "clsx";
import { Tooltip } from "react-tooltip";

// This is a sub-component used only within the sidebar.
// It handles rendering both simple links and dropdowns in the EXPANDED view.
const ExpandedNavItem = ({ item }) => {
  const { pathname } = useLocation();
  const isParentOfActiveLink = item.children?.some((child) =>
    pathname.startsWith(child.path)
  );
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(isParentOfActiveLink);

  // Render a dropdown button if the item has children
  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
          className="flex items-center justify-between w-full px-3 py-2.5 text-base font-medium text-left rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="flex items-center">
            <item.icon className="mr-3 flex-shrink-0" size={20} />
            <span>{item.name}</span>
          </div>
          <FiChevronRight
            className={clsx("transition-transform", {
              "rotate-90": isSubMenuOpen,
            })}
          />
        </button>
        {isSubMenuOpen && (
          <div className="mt-1 pl-7 space-y-1">
            {item.children.map((child) => (
              <ExpandedNavItem key={child.name} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render a simple NavLink if the item has no children
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        clsx(
          "flex items-center w-full px-3 py-2.5 text-base font-medium text-left rounded-lg transition-colors",
          isActive
            ? "active-link bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        )
      }
    >
      <item.icon className="mr-3 flex-shrink-0" size={20} />
      <span>{item.name}</span>
    </NavLink>
  );
};

// This is the main Sidebar component
const DashboardSidebar = ({ isCollapsed, toggleCollapse }) => {
  return (
    // The main container's width changes based on the 'isCollapsed' prop
    <aside
      className={clsx(
        "sidebar h-screen bg-white dark:bg-gray-800 flex flex-col border-r border-gray-100 dark:border-gray-700 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Top section with Logo and the Collapse button */}
      <div className="p-4 h-[68px] flex-shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        {/* Logo and Text are only shown when not collapsed */}
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
        {navLinks.map((link) =>
          isCollapsed ? (
            // In collapsed mode, render a simple icon link with a tooltip
            <NavLink
              key={link.name}
              to={!link.children ? link.path : "#"} // Dropdowns aren't clickable when collapsed
              data-tooltip-id="nav-tooltip"
              data-tooltip-content={link.name}
              className={({ isActive }) =>
                clsx(
                  "flex items-center justify-center p-3 rounded-lg",
                  isActive && !link.children
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )
              }
            >
              <link.icon size={20} />
            </NavLink>
          ) : (
            // In expanded mode, render the full NavItem with text and dropdowns
            <ExpandedNavItem key={link.name} item={link} />
          )
        )}
      </nav>

      {/* The Tooltip component from the library, which reads the data-* attributes */}
      <Tooltip id="nav-tooltip" place="right" effect="solid" className="z-50" />
    </aside>
  );
};

export default DashboardSidebar;
