import React from 'react';
import GroupDetailPage from './GroupDetailPage'; // Import the reusable component

const MyGroupDetailPage = () => {
    // Render the GroupDetailPage component and tell it to act as the "Teacher View"
    return <GroupDetailPage isTeacherView={true} />;
};

export default MyGroupDetailPage;
