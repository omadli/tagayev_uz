import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Tabs, Tab, Box, CircularProgress } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { getMuiTheme } from "../theme/muiTheme";
import { useSettings } from "../context/SettingsContext";

import EditStudentModal from "../components/students/EditStudentModal";
import AddPaymentModal from "../components/finance/AddPaymentModal";
import EnrollStudentModal from "../components/students/EnrollStudentModal";

// Import all the 'smart' tab components
import StudentInfoPanel from "../components/students/detail/StudentInfoPanel";
import StudentGroupsTab from "../components/students/detail/StudentGroupsTab";
import StudentPaymentsTab from "../components/students/detail/StudentPaymentsTab";
// Assume these will be created later
// import StudentAttendanceTab from '../components/students/detail/StudentAttendanceTab';
// import StudentParentsTab from '../components/students/detail/StudentParentsTab';

// Define the valid tabs and their order
const TABS = ["groups", "payments", "attendance", "parents", "notes"];

const StudentDetailPage = () => {
  // --- HOOKS and STATE ---
  const { studentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useSettings();
  const muiTheme = getMuiTheme(theme);

  // State for the main student object (for the info panel)
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // --- TAB MANAGEMENT LOGIC ---
  // Get the active tab from the URL, default to the first one if invalid
  const activeTab = TABS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : TABS[0];
  // Find the corresponding index for the MUI Tabs component
  const activeTabIndex = TABS.indexOf(activeTab);

  // This function is called by the MUI Tabs component when the user clicks a new tab
  const handleTabChange = (event, newIndex) => {
    // Update the URL search parameter, which will trigger a re-render
    setSearchParams({ tab: TABS[newIndex] });
  };

  // --- DATA FETCHING ---
  // This callback fetches only the core student information for the info panel.
  const fetchStudentDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/core/students/${studentId}/`);
      setStudent(response.data);
    } catch (error) {
      toast.error("O'quvchi ma'lumotlarini yuklab bo'lmadi.");
      console.error("Fetch Student Detail Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  // Fetch the main student data when the component mounts
  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const handleEdit = () => setIsEditModalOpen(true);
  const handleEnroll = () => {
    setIsEnrollModalOpen(true);
  };

  const handleAddPayment = () => {
    if (!student.groups || student.groups.length === 0) {
      toast.error(`${student.full_name} hech qanday faol guruhga a'zo emas.`);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleArchive = async (student) => {
    const isArchiving = !student.is_archived;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/core/students/${studentId}/${action}/`);
      toast.success(
        `${student.full_name} - ${student.phone_number} ${
          isArchiving ? "arxivlandi" : "tiklandi"
        }.`,
        { id: toastId }
      );
      fetchStudentDetails();
    } catch (err) {
      const errorData = err.response?.data;
      const msg =
        typeof errorData === "object"
          ? Object.values(errorData).flat().join(" ")
          : "Xatolik yuz berdi";
      toast.error(msg, { id: toastId });
    }
  };

  const handleDelete = async (student) => {
    if (
      window.confirm(
        `${student.full_name} ni o'chirishga ishonchingiz komilmi?`
      )
    ) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/core/students/${studentId}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchStudentDetails();
      } catch (err) {
        const errorData = err.response?.data;
        const msg =
          typeof errorData === "object"
            ? Object.values(errorData).flat().join(" ")
            : "Xatolik yuz berdi";
        toast.error(msg, { id: toastId });
      }
    }
  };

  const handleSendMessage = () => toast("Bu funksiya tez kunda qo'shiladi!");

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex justify-center mt-20">
        <CircularProgress />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center mt-20">O'quvchi topilmadi.</div>;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* The left-side info panel, which receives the fetched student data */}
        <StudentInfoPanel
          student={student}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onEnroll={handleEnroll}
          onAddPayment={handleAddPayment}
          onSendMessage={handleSendMessage}
        />

        {/* The right-side container for the tab content */}
        <div className="w-full lg:flex-1 bg-white dark:bg-dark-secondary p-4 rounded-xl shadow-sm">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTabIndex}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Guruhlari" id="tab-guruhlari" />
              <Tab label="To'lovlar" id="tab-tolovlar" />
              <Tab label="Davomat" id="tab-davomat" />
              <Tab label="Ota-ona" id="tab-ota-ona" />
              <Tab label="Izohlar" id="tab-izohlar" />
            </Tabs>
          </Box>
          <div className="mt-6">
            {activeTab === "groups" && (
              <StudentGroupsTab studentId={student.id} />
            )}
            {activeTab === "payments" && (
              <StudentPaymentsTab studentId={student.id} />
            )}
            {activeTab === "attendance" && <div>Davomat Tab Content Here</div>}
            {activeTab === "parents" && <div>Ota-ona Tab Content Here</div>}
            {activeTab === "notes" && <div>Izohlar Tab Content Here</div>}
          </div>
        </div>
      </div>
      {student && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
          refreshStudents={fetchStudentDetails}
          student={student}
        />
      )}
      {student && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => {
            setIsEnrollModalOpen(false);
          }}
          refreshStudents={fetchStudentDetails}
          student={student}
        />
      )}
      {student && isPaymentModalOpen && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
          }}
          initialStudent={{
            value: student.id,
            label: `${student.full_name} (+${student.phone_number})`,
          }}
        />
      )}
    </ThemeProvider>
  );
};

export default StudentDetailPage;
