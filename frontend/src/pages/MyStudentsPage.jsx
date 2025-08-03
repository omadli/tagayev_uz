import React from "react";
import StudentsPage from "./StudentsPage"; // Import the reusable component

const MyStudentsPage = () => {
  // Render the StudentsPage component and tell it to act as the "My Students" variant
  return <StudentsPage isMyStudentsPage={true} />;
};

export default MyStudentsPage;
