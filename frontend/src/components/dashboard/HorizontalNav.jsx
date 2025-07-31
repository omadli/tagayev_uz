import React from "react";
import { NavLink } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { navLinks } from "../../data/navigation";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

// This is the sub-component for each individual navigation item.
const HorizontalNavItem = ({ item }) => {
  // Shared classes for all items
  const linkClasses =
    "flex items-center px-3 py-2 text-sm font-medium rounded-md";
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses =
    "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

  // If the item has children, render it as a dropdown button
  if (item.children) {
    return (
      <div className="relative group">
        <button className={clsx(linkClasses, inactiveClasses, "space-x-2")}>
          <item.icon size={16} strokeWidth={1.5} />
          <span>{item.name}</span>
          <ChevronDown size={14} />
        </button>
        {/* The dropdown menu that appears on hover */}
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-20 border dark:border-gray-700">
          {item.children.map((child) => (
            <NavLink
              key={child.name}
              to={child.path}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {/* --- THIS IS THE FIX --- */}
              {/* Render the icon for the child link */}
              <child.icon
                className="mr-3 text-gray-400"
                size={16}
                strokeWidth={1.5}
              />
              <span>{child.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  // If the item has no children, render it as a simple NavLink
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        clsx(linkClasses, isActive ? activeClasses : inactiveClasses)
      }
    >
      <item.icon className="mr-2" size={16} strokeWidth={1.5} />
      <span>{item.name}</span>
    </NavLink>
  );
};

// This is the main component that renders the full navigation bar.
const HorizontalNav = () => {
  const { layoutWidth } = useSettings();

  return (
    <div className="border-t border-gray-100 dark:border-gray-700">
      {/* The inner container that respects the "Chegaralangan" setting */}
      <div
        className={clsx("w-full", {
          "max-w-screen-2xl mx-auto": layoutWidth === "contained",
          "px-4 sm:px-6": layoutWidth === "full",
        })}
      >
        <nav
          className={clsx("flex items-center space-x-1 p-2", {
            "justify-center": layoutWidth === "contained",
            "justify-start": layoutWidth === "full",
          })}
        >
          {navLinks.map((link) => (
            <HorizontalNavItem key={link.name} item={link} />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default HorizontalNav;
