import React from "react";
import { useSettings } from "../../context/SettingsContext";
import { navLinks as allNavLinks } from "../../data/navigation";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { ThemeProvider } from '@mui/material/styles';
import { getMuiTheme } from '../../theme/muiTheme';

// Import our new, powerful NavItem
import HorizontalNavItem from "./HorizontalNavItem";


// The main component that renders the full navigation bar.
const HorizontalNav = () => {
  const { layoutWidth, theme } = useSettings();
  const { user } = useAuth();
  const muiTheme = getMuiTheme(theme); // Get the correct theme for MUI

  const filterNavLinks = (links) => {
    if (!user || !user.roles) return [];
    return links.reduce((filtered, link) => {
      const getPath = (item) => {
        if (typeof item.getPath === "function") {
          return item.getPath(user);
        }
        return item.path;
      };

      if (
        !link.allowedRoles ||
        user.roles.some((role) => link.allowedRoles.includes(role))
      ) {
        const newItem = { ...link, path: getPath(link) };
        if (link.children) {
          const filteredChildren = filterNavLinks(link.children);
          if (filteredChildren.length > 0) {
            newItem.children = filteredChildren;
            filtered.push(newItem);
          } else if (!newItem.path) {
            // Don't add a parent with no path and no visible children
          } else {
            delete newItem.children;
            filtered.push(newItem);
          }
        } else {
          filtered.push(newItem);
        }
      }
      return filtered;
    }, []);
  };

  const visibleNavLinks = filterNavLinks(allNavLinks);

  return (
    <ThemeProvider theme={muiTheme}>
    <div className="border-t border-gray-100 dark:border-dark-tertiary">
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
          {visibleNavLinks.map((link) => (
            <HorizontalNavItem key={link.name} item={link} />
          ))}
        </nav>
      </div>
    </div>
    </ThemeProvider>
  );
};

export default HorizontalNav;
