import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import {
  Plus,
  Search,
  Sheet,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  DollarSign,
  Trash2,
  UserPlus,
} from "lucide-react";
import Select from "react-select";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  ProgressComponent,
} from "../data/dataTableStyles.jsx";

import Avatar from "@mui/material/Avatar";
import { stringAvatar } from "../components/ui/Avatar";

// Import child components
import ActionPopup from "../components/ui/ActionPopup";
import AddStudentModal from "../components/students/AddStudentModal";
import EditStudentModal from "../components/students/EditStudentModal";
import EnrollStudentModal from "../components/students/EnrollStudentModal";
import AddPaymentModal from "../components/finance/AddPaymentModal";

const StudentsPage = ({ isMyStudentsPage = false }) => {
  // --- Get selectedBranchId from the layout ---
  const { theme, selectedBranchId } = useSettings();
  const { user: currentUser } = useAuth();
  // --- STATE MANAGEMENT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [actionPopup, setActionPopup] = useState({
    isOpen: false, // The parent controls the visibility
    student: null,
    referenceElement: null,
  });

  // State for all filters
  const [filters, setFilters] = useState({
    search: "",
    is_archived: false,
    branch: null, // Start with null
    group_status: null,
    payment_status: null,
    group_id: null,
    teacher_id: isMyStudentsPage ? currentUser.user_id : null,
  });

  // State to hold data for filter dropdowns
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    if (selectedBranchId) {
      setFilters((prev) => ({ ...prev, branch: selectedBranchId }));
    }
  }, [selectedBranchId]);

  // --- DATA FETCHING ---
  // Fetch data for the filter dropdowns once on component mount
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        if (!isMyStudentsPage) {
          const teachersRes = await api.get(
            "/users/teachers/?is_archived=false"
          );
          setTeachers(
            teachersRes.data.map((t) => ({
              value: t.id,
              label: t.full_name,
            }))
          );
        }
        // For "My Students", only fetch the groups belonging to the current teacher.
        const groupsParams = isMyStudentsPage
          ? { teacher: currentUser.user_id }
          : {};
        // Fetch only active groups and teachers for the filters
        const groupsRes = await api.get("/core/groups/", {
          params: groupsParams,
        });
        setGroups(
          groupsRes.data.map((g) => ({
            value: g.id,
            label: `${g.name} - ${g.teacher_name}`,
          }))
        );
      } catch (error) {
        toast.error("Filtr ma'lumotlarini yuklashda xatolik.");
      }
    };
    fetchFilterData();
  }, [isMyStudentsPage, currentUser.user_id]);

  // Callback to fetch students whenever filters change
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    // Don't fetch if the branch isn't loaded yet
    if (!filters.branch) {
      setIsLoading(false);
      return;
    }
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== "")
    );
    try {
      const response = await api.get("/core/students/", {
        params: activeFilters,
      });
      setStudents(response.data.results || response.data);
    } catch (error) {
      toast.error("O'quvchilarni yuklashda xatolik.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const groupStatusOptions = [
    { value: "active", label: "Faol" },
    { value: "inactive", label: "Faol Emas" }, // 'Inactive' in Uzbek
    { value: "groupless", label: "Guruhsiz" },
  ];

  const paymentStatusOptions = [
    { value: "debtor", label: "Qarzdor" },
    { value: "due_soon", label: "To'lovi yaqin" },
    { value: "overpaid", label: "Ortiqcha to'lov" },
  ];

  // --- FUNCTION TO OPEN THE POPUP ---
  const openActionPopup = (e, student) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true, // Set isOpen to true here
      student: student,
      referenceElement: e.currentTarget, // Store the button element itself
    });
  };

  const closeActionPopup = () => {
    setActionPopup({ isOpen: false, student: null, referenceElement: null });
  };

  // --- EVENT HANDLERS ---
  const handleFilterChange = (filterName, selectedOption) => {
    const value = selectedOption ? selectedOption.value : null;
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleRowSelected = useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  // --- Action Handlers for a specific student ---
  const handleView = (student) => alert(`Viewing ${student.full_name}`);

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleEnroll = (student) => {
    setSelectedStudent(student);
    setIsEnrollModalOpen(true);
  };

  const handleArchive = async (student) => {
    const isArchiving = !student.is_archived;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/core/students/${student.id}/${action}/`);
      toast.success(
        `${student.full_name} - ${student.phone_number} ${
          isArchiving ? "arxivlandi" : "tiklandi"
        }.`,
        { id: toastId }
      );
      fetchStudents();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
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
        await api.delete(`/core/students/${student.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchStudents();
      } catch (error) {
        toast.error("Xatolik yuz berdi", { id: toastId });
      }
    }
  };
  const handleAddPayment = (student) => {
    // 1. Check if the student has any active groups.
    //    The 'groups' array comes directly from our StudentSerializer.
    if (!student.groups || student.groups.length === 0) {
      // 2. If not, show an informative alert and do nothing else.
      toast.error(`${student.full_name} hech qanday faol guruhga a'zo emas.`);
      return;
    }

    // 3. If they have groups, set them as the selected student and open the payment modal.
    setSelectedStudent(student);
    setIsPaymentModalOpen(true);
  };
  const handleAddComment = (student) =>
    alert(`Adding comment for ${student.full_name}`);
  const handleSendMessage = (student) =>
    alert(`Sending message to ${student.full_name}`);

  const getStudentActions = (student) => {
    let actions = [
      { label: "Ko'rish", icon: Eye, onClick: () => handleView(student) },
      {
        label: "Izoh",
        icon: FileText,
        onClick: () => handleAddComment(student),
      },
      {
        label: "To'lov",
        icon: DollarSign,
        onClick: () => handleAddPayment(student),
      },
      // { isSeparator: true },
      {
        label: "Xabar",
        icon: MessageSquare,
        onClick: () => handleSendMessage(student),
      },
    ];

    // Only add admin/CEO actions if it's the main students page
    if (!isMyStudentsPage) {
      actions.splice(2, 0, {
        label: "Tahrirlash",
        icon: Edit,
        onClick: () => handleEdit(student),
      });
      actions.splice(3, 0, {
        label: "Guruhga qo'shish",
        icon: UserPlus,
        onClick: () => handleEnroll(student),
      });
      actions.push(
        { isSeparator: true },
        {
          label: !student?.is_archived ? "Arxivlash" : "Arxivdan chiqarish",
          icon: !student?.is_archived ? BiArchiveIn : BiArchiveOut,
          onClick: () => handleArchive(student),
          className: "text-orange-600 dark:text-orange-500",
        },
        {
          label: "O'chirish",
          icon: Trash2,
          onClick: () => handleDelete(student),
          className: "text-red-600 dark:text-red-500",
        }
      );
    }
    return actions;
  };

  // --- FORMATTING & TABLE DEFINITION ---
  const formatCurrency = (num) =>
    new Intl.NumberFormat("fr-FR").format(num) + " so'm";

  const columns = [
    { name: "№", selector: (row, i) => i + 1, width: "60px" },
    {
      name: "Rasm",
      center: true,
      cell: (row) =>
        row.profile_photo ? (
          <Avatar alt={row.full_name} src={row.profile_photo} />
        ) : (
          <Avatar {...stringAvatar(row.full_name)} />
        ),
      width: "80px",
    },
    {
      name: "Ism familiya",
      selector: (row) => row.full_name,
      sortable: true,
      cell: (row) => (
        <div className="font-medium truncate" style={{ minWidth: "180px" }}>
          {row.full_name}
        </div>
      ),
    },
    {
      name: "Telefon raqami",
      center: true,
      selector: (row) => `+${row.phone_number}`,
      sortable: true,
    },
    {
      name: "Balans",
      selector: (row) => row.balance,
      sortable: true,
      cell: (row) => (
        <span
          className={clsx(
            "px-2 py-1 rounded-full text-xs font-medium",
            row.balance >= 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {formatCurrency(row.balance || 0)}
        </span>
      ),
    },
    {
      name: "Guruhlari",
      // --- FIX for 'grow' prop ---
      // We control the width and content in the cell renderer.
      cell: (row) => (
        <div style={{ minWidth: "400px" }} className="w-full text-left">
          {row.groups.length > 0 ? (
            <div className="text-xs space-y-1">
              {row.groups.map((g) => (
                <div key={g.name} className="truncate">
                  {g.name} - {g.teacher}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-orange-600 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full text-xs font-medium">
              Guruhsiz
            </span>
          )}
        </div>
      ),
    },

    {
      name: "Izoh",
      selector: (row) => row.comment || "Izoh yo'q",
      // --- FIX for 'grow' prop ---
      // We control the width directly with inline styles on the cell's content.
      cell: (row) => (
        <div className="truncate" style={{ minWidth: "150px" }}>
          {row.comment || "Izoh yo'q"}
        </div>
      ),
    },
    {
      name: "Harakatlar",
      cell: (row) => (
        // We use Tailwind classes to center the button
        <div className="w-full flex justify-center">
          <button
            onClick={(e) => openActionPopup(e, row)}
            className="p-2 -m-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-text-light-primary">
            {isMyStudentsPage ? "Mening O'quvchilarim" : "O'quvchilar"}
          </h1>
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            O'quvchilar soni: {students.length} ta
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-200 flex items-center space-x-2">
            <Sheet size={16} /> EXCEL
          </button>
          <button className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200 flex items-center space-x-2">
            <MessageSquare size={16} /> XABAR YUBORISH
          </button>
          {!isMyStudentsPage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={16} /> YANGI QO'SHISH
            </button>
          )}
          <div className="flex items-center space-x-2 justify-end">
            <label className="text-sm font-medium">Arxiv</label>
            <button
              id="archive-toggle"
              onClick={() =>
                setFilters({ ...filters, is_archived: !filters.is_archived })
              }
              type="button"
              role="switch"
              className={clsx(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                filters.is_archived
                  ? "bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-600"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  filters.is_archived ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 dark:text-gray-200">
        <div className="relative col-span-2">
          <input
            type="text"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Qidirish..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
        {!isMyStudentsPage && (
          <Select
            placeholder="Holati"
            options={groupStatusOptions}
            isClearable
            onChange={(opt) => handleFilterChange("group_status", opt)}
          />
        )}
        <Select
          placeholder="To'lov holati"
          options={paymentStatusOptions}
          isClearable
          onChange={(opt) => handleFilterChange("payment_status", opt)}
        />
        <Select
          placeholder="Guruh"
          options={groups}
          isClearable
          onChange={(opt) => handleFilterChange("group_id", opt)}
        />
        {!isMyStudentsPage && (
          <Select
            placeholder="Ustoz"
            options={teachers}
            isClearable
            onChange={(opt) => handleFilterChange("teacher_id", opt)}
          />
        )}
      </div>

      <div className="bg-white dark:bg-blue-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-tertiary">
        <DataTable
          columns={columns}
          data={students}
          progressPending={isLoading}
          responsive
          selectableRows
          highlightOnHover
          onSelectedRowsChange={handleRowSelected}
          // pagination
          // paginationRowsPerPageOptions={[10, 30, 50, 100]}
          // paginationComponentOptions={paginationComponentOptions}
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          progressComponent={<ProgressComponent />}
          noDataComponent={<NoDataComponent />}
        />
      </div>

      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title={actionPopup.student?.full_name}
        actions={
          actionPopup.student ? getStudentActions(actionPopup.student) : []
        }
      />

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refreshStudents={fetchStudents}
        selectedBranchId={filters.branch}
      />

      {selectedStudent && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null); // Clear the selected student on close
          }}
          refreshStudents={fetchStudents}
          student={selectedStudent}
        />
      )}

      {selectedStudent && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => {
            setIsEnrollModalOpen(false);
            setSelectedStudent(null);
          }}
          refreshStudents={fetchStudents}
          student={selectedStudent}
        />
      )}

      {selectedStudent && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedStudent(null);
          }}
          // --- PASS THE PRE-SELECTED STUDENT AS A PROP ---
          initialStudent={{
            value: selectedStudent.id,
            label: `${selectedStudent.full_name} (+${selectedStudent.phone_number})`,
          }}
        />
      )}
    </div>
  );
};

export default StudentsPage;
