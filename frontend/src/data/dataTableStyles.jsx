import React from "react"; // This import is necessary for JSX

export const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  header: { style: { display: "none" } },
  headRow: {
    style: {
      backgroundColor: "transparent",
      borderBottomColor: "#e5e7eb",
      borderBottomWidth: "1px",
    },
  },
  headCells: {
    style: {
      color: "#6b7187",
      fontSize: "14px",
      fontWeight: 600,
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      backgroundColor: "transparent",
      minHeight: "60px",
      borderBottom: "none",
      overflow: "visible",
      color: "#111827",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#e7ebfcff",
      borderColor: "#518afcff",
      borderWidth: "1px",
      transitionDuration: "150ms",
      transitionProperty: "background-color",
    },
  },
  pagination: { style: { backgroundColor: "transparent", borderTop: "none" } },
  selectableRows: { style: { backgroundColor: "transparent" } },
};

export const darkThemeStyles = {
  ...customStyles,
  headRow: {
    style: { ...customStyles.headRow.style, borderBottomColor: "#2F3B60" },
  }, // dark-tertiary
  headCells: {
    style: {
      ...customStyles.headCells.style,
      color: "#A6B0CF", // text-light-secondary
    },
  },
  rows: {
    style: {
      ...customStyles.rows.style,
      color: "#F2F2F2",
      backgroundColor: "#222E4E",
    }, // bg-dark-secondary, text-light-primary
    highlightOnHoverStyle: {
      backgroundColor: "#2F3B60", // dark-tertiary
      transitionDuration: "0.15s",
      transitionProperty: "background-color",
    },
  },
  pagination: {
    style: {
      ...customStyles.pagination.style,
      color: "#A6B0CF",
      backgroundColor: "#222E4E",
    },
    pageButtonsStyle: { fill: "#A6B0CF" },
  },
  selectableRows: { style: { backgroundColor: "#222E4E" } },
};

export const NoDataComponent = () => (
  <div className="text-center py-16 text-gray-500 dark:text-text-light-primary dark:bg-gray-700 w-full">
    Ma'lumotlar topilmadi.
  </div>
);

export const ProgressComponent = () => (
  <div className="text-center py-16 text-gray-500 dark:text-text-light-primary dark:bg-gray-700 w-full">
    Ma'lumotlar yuklanmoqda...
  </div>
);

export const paginationComponentOptions = {
  rowsPerPageText: "Har sahifada:",
  rangeSeparatorText: "dan",
  selectAllRowsItem: true, // Set to false if you don't need the "All" option
  selectAllRowsItemText: "Barchasi",
};
