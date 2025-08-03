import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import clsx from "clsx";
import { useSettings } from "../../context/SettingsContext";

const BranchChanger = () => {
  // --- HOOKS FIX: All hooks are now at the top level ---
  const { branches, selectedBranchId, setSelectedBranchId, branchesLoading } =
    useSettings();
  const [isOpen, setIsOpen] = useState(false);
  // Set initial state safely, handling the case where branches might be empty initially
  const dropdownRef = useRef(null);

  // This effect updates the selected branch only when the branches prop changes
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0]);
    }
  }, [branches, selectedBranchId]);

  // This effect handles closing the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBranch = (branchId) => {
    setSelectedBranchId(branchId); // Call the global state updater from the context
    setIsOpen(false);
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // --- RENDER FIX: The loading/empty state logic is now after the hooks ---
  if (branchesLoading || !selectedBranch) {
    return (
      <div className="bg-gray-200 dark:bg-dark-tertiary rounded-lg h-10 w-36 animate-pulse"></div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full min-w-[150px] bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{selectedBranch.name}</span>
        <FiChevronDown
          className={clsx("transition-transform", { "rotate-180": isOpen })}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border dark:border-gray-700 py-1">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSelectBranch(branch.id)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {branch.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchChanger;
