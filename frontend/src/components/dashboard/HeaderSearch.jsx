import React from "react";
import AsyncSelect from "react-select/async";
import { FaUserGraduate, FaUserTie } from "react-icons/fa";
import api from "../../services/api";

// Custom component to render each option in the dropdown
const formatOptionLabel = (data) => (
  <div className="flex items-center">
    {data.type === "student" && (
      <FaUserGraduate className="mr-3 text-blue-500" />
    )}
    {data.type === "teacher" && <FaUserTie className="mr-3 text-purple-500" />}
    <div>
      <div className="font-semibold">{data.name}</div>
      <div className="text-xs text-gray-500">{data.phone}</div>
    </div>
  </div>
);

// Function to load options from the API
const loadOptions = (inputValue, callback) => {
  if (!inputValue) {
    callback([]);
    return;
  }

  api.get(`/core/global-search/?q=${inputValue}`).then((response) => {
    const formattedOptions = response.data.map((item) => ({
      ...item,
      value: `${item.type}-${item.id}`, // Create a unique value for react-select
      label: item.name,
    }));
    callback(formattedOptions);
  });
};

// Custom styles to make react-select match the theme
const selectStyles = {
  control: (styles) => ({
    ...styles,
    backgroundColor: "var(--color-bg-secondary)",
    border: "none",
    boxShadow: "none",
    minHeight: "42px",
  }),
  input: (styles) => ({ ...styles, color: "var(--color-text-primary)" }),
  placeholder: (styles) => ({
    ...styles,
    color: "var(--color-text-secondary)",
  }),
  // ... add more styles for menu, option, etc. as needed for dark mode
};

const HeaderSearch = () => {
  return (
    <div className="relative w-full max-w-2xl">
      <style>{`
        :root {
          --color-bg-secondary: #F3F4F6;
          --color-text-primary: #111827;
          --color-text-secondary: #6B7280;
        }
        html.dark {
          --color-bg-secondary: #374151;
          --color-text-primary: #F9FAFB;
          --color-text-secondary: #9CA3AF;
        }
      `}</style>
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        formatOptionLabel={formatOptionLabel}
        placeholder="O'quvchi yoki O'qituvchi qidirish..."
        styles={selectStyles}
        // Add onChange handler to navigate to the selected user's page
        onChange={(selectedOption) => {
          if (selectedOption) {
            console.log("Navigate to:", selectedOption.type, selectedOption.id);
            // Example: navigate(`/${selectedOption.type}s/${selectedOption.id}`);
          }
        }}
      />
    </div>
  );
};

export default HeaderSearch;
