import React from 'react';
import GroupsPage from './GroupsPage'; // Import the reusable component

const MyGroupsPage = () => {
    // Render the GroupsPage component and tell it to act as the "My Groups" variant
    return <GroupsPage isTeacherMyGroupsPage={true} />;
};

export default MyGroupsPage;
