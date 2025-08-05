import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Tabs, Tab, Box, CircularProgress } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { getMuiTheme } from "../theme/muiTheme";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext.jsx";

// Import all child components
import GroupInfoPanel from "../components/groups/detail/GroupInfoPanel";
import AttendanceTab from "../components/groups/detail/AttendanceTab";
import StudentListTab from "../components/groups/detail/StudentListTab";
import GroupCalendarTab from "../components/groups/detail/GroupCalendarTab";
import PriceHistoryTab from "../components/groups/detail/PriceHistoryTab.jsx";

// Import all necessary modals
import EditGroupModal from "../components/groups/EditGroupModal";
import PriceChangeModal from "../components/groups/PriceChangeModal";
import AddStudentToGroupModal from "../components/groups/AddStudentToGroupModal";

const GroupDetailPage = ({ isTeacherView = false }) => {
  // --- STATE MANAGEMENT ---
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { theme, selectedBranchId } = useSettings();
  const muiTheme = getMuiTheme(theme);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { user: currentUser } = useAuth();
  const isManager =
    !isTeacherView ||
    currentUser.roles.includes("Admin") ||
    currentUser.roles.includes("CEO");

  // State for all modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // --- DATA FETCHING ---
  const fetchGroupDetails = useCallback(async () => {
    if (!group) setIsLoading(true);
    try {
      const response = await api.get(`/core/groups/${groupId}/`);
      setGroup(response.data);
    } catch (error) {
      toast.error("Guruh ma'lumotlarini yuklab bo'lmadi.");
      console.error("Fetch Group Detail Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, group]);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // --- ACTION HANDLERS ---
  const handleEdit = () => setIsEditModalOpen(true);
  const handlePriceChange = () => setIsPriceModalOpen(true);
  const handleAddStudent = () => setIsAddStudentModalOpen(true);
  const handleSendMessage = () => toast("Bu funksiya tez kunda qo'shiladi!");

  const handleArchive = async () => {
    if (!group) return;
    const isArchiving = !group.is_archived;
    if (
      window.confirm(
        `${group.name} ni ${
          isArchiving ? "arxivlash" : "tiklash"
        }ga ishonchingiz komilmi?`
      )
    ) {
      const action = isArchiving ? "archive" : "restore";
      const toastId = toast.loading(
        `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
      );
      try {
        await api.post(`/core/groups/${group.id}/${action}/`);
        toast.success("Muvaffaqiyatli bajarildi", { id: toastId });
        fetchGroupDetails(); // Re-fetch the data to get the new status
      } catch (error) {
        const errorMsg = error.response?.data?.detail || "Xatolik yuz berdi";
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    if (window.confirm(`${group.name} ni o'chirishga ishonchingiz komilmi?`)) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/core/groups/${group.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        navigate("/groups"); // Navigate back to the list after deletion
      } catch (error) {
        const errorMsg = error.response?.data?.detail || "Xatolik yuz berdi";
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center mt-20">
        <CircularProgress />
      </div>
    );

  if (!group) return <div className="text-center mt-20">Guruh topilmadi.</div>;

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* The left-side info panel */}
        <GroupInfoPanel
          group={group}
          isTeacherView={isTeacherView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onAddStudent={handleAddStudent}
          onPriceChange={handlePriceChange}
          onSendMessage={handleSendMessage}
        />

        {/* The right-side tab container */}
        <div className="w-full lg:flex-1 bg-white dark:bg-dark-secondary p-4 rounded-xl shadow-sm">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Davomat" />
              <Tab label="O'quvchilar" />
              <Tab label="Kalendar" />
              <Tab label="Narxlar Tarixi" />
            </Tabs>
          </Box>

          <div className="mt-6">
            {activeTab === 0 && <AttendanceTab group={group} />}
            {activeTab === 1 && (
              <StudentListTab
                group={group}
                refreshGroupDetails={fetchGroupDetails}
              />
            )}
            {activeTab === 2 && <GroupCalendarTab group={group} />}
            {activeTab === 3 && (
              <PriceHistoryTab
                priceHistory={group.price_history || []}
                groupId={groupId}
                refreshGroupDetails={fetchGroupDetails}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals are only rendered for the manager view */}
      {isManager && (
        <>
          <EditGroupModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            refreshGroups={fetchGroupDetails}
            group={group}
            selectedBranchId={selectedBranchId}
          />
          <PriceChangeModal
            isOpen={isPriceModalOpen}
            onClose={() => setIsPriceModalOpen(false)}
            refreshGroups={fetchGroupDetails}
            group={group}
          />
          <AddStudentToGroupModal
            isOpen={isAddStudentModalOpen}
            onClose={() => setIsAddStudentModalOpen(false)}
            refreshGroups={fetchGroupDetails}
            group={group}
          />
        </>
      )}
    </ThemeProvider>
  );
};

export default GroupDetailPage;
