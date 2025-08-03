import React, { useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, MenuItem, ThemeProvider } from "@mui/material";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getMuiTheme } from "../../theme/muiTheme";
import { useSettings } from "../../context/SettingsContext";
import clsx from "clsx";

const HorizontalNavItem = ({ item }) => {
  const { pathname } = useLocation();
  const { theme } = useSettings();
  const muiTheme = getMuiTheme(theme);
  const [anchorEl, setAnchorEl] = useState(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const ref = useRef(null);

  const isOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setOpenSubMenu(null);
  };

  const handleSubMenuEnter = (event, childName) => {
    setSubMenuAnchorEl(event.currentTarget);
    setOpenSubMenu(childName);
  };

  const handleSubMenuLeave = () => {
    // A short delay before closing to allow moving the mouse to the submenu
    setTimeout(() => {
      if (!ref.current?.matches(":hover")) {
        setOpenSubMenu(null);
      }
    }, 100);
  };

  const isChildActive = (item) => {
    if (!item.children) return false;
    return item.children.some(
      (child) => pathname.startsWith(child.path) || isChildActive(child)
    );
  };

  const getButtonClasses = (isActive) => {
    return clsx(
      "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors h-10 whitespace-nowrap",
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-600 dark:text-text-light-secondary hover:bg-gray-100 dark:hover:bg-dark-accent"
    );
  };

  // --- RENDER LOGIC FOR ITEMS WITH CHILDREN (DROPDOWNS) ---
  if (item.children) {
    const isActive = isChildActive(item);
    return (
      <ThemeProvider theme={muiTheme}>
        <button
          id={`menu-button-${item.name}`}
          aria-controls={isOpen ? `menu-${item.name}` : undefined}
          aria-haspopup="true"
          aria-expanded={isOpen ? "true" : undefined}
          onClick={handleClick}
          className={getButtonClasses(isActive)}
        >
          <item.icon size={18} strokeWidth={1.5} />
          <span>{item.name}</span>
          <ChevronDown size={16} />
        </button>
        <Menu
          id={`menu-${item.name}`}
          anchorEl={anchorEl}
          open={isOpen}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        MenuListProps={{ "aria-labelledby": `menu-button-${item.name}` }}
        >
          {item.children.map((child) => (
            <MenuItem
              key={child.name}
              component={!child.children ? NavLink : "div"}
              to={child.path}
              onClick={!child.children ? handleClose : undefined}
              onMouseEnter={(e) =>
                child.children && handleSubMenuEnter(e, child.name)
              }
              onMouseLeave={() => child.children && handleSubMenuLeave()}
            >
              <child.icon size={16} className="mr-3" />
              {child.name}
              {child.children && <ChevronRight size={14} className="ml-auto" />}

              {/* --- RECURSIVE SUB-MENU --- */}
              {child.children && (
                <Menu
                  ref={ref}
                  anchorEl={subMenuAnchorEl}
                  open={openSubMenu === child.name}
                  onClose={() => setOpenSubMenu(null)}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  MenuListProps={{ onMouseLeave: () => setOpenSubMenu(null) }}
                >
                  {child.children.map((grandChild) => (
                    <MenuItem
                      key={grandChild.name}
                      component={NavLink}
                      to={grandChild.path}
                      onClick={handleClose}
                    >
                      <grandChild.icon size={16} className="mr-3" />
                      {grandChild.name}
                    </MenuItem>
                  ))}
                </Menu>
              )}
            </MenuItem>
          ))}
        </Menu>
      </ThemeProvider>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => getButtonClasses(isActive)}
    >
      <item.icon size={18} strokeWidth={1.5} />
      <span>{item.name}</span>
    </NavLink>
  );
};

export default HorizontalNavItem;
