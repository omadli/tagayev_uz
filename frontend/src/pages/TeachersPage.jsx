import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import {
  Plus,
  Search,
  User,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";

import clsx from "clsx";
import AddTeacherModal from "../components/teachers/AddTeacherModal";
import EditTeacherModal from "../components/teachers/EditTeacherModal";
import ActionPopup from "../components/ui/ActionPopup";
import { useSettings } from "../context/SettingsContext";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  paginationComponentOptions,
  ProgressComponent,
} from "../data/dataTableStyles.jsx";
import {stringAvatar} from "../components/ui/Avatar";
import Avatar from '@mui/material/Avatar';

const TeachersPage = () => {
  // State management for data, UI controls, and the modal
  const { theme } = useSettings();
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [actionPopup, setActionPopup] = useState({
    isOpen: false, // The parent controls the visibility
    student: null,
    referenceElement: null,
  });

  // Memoized callback for fetching teacher data from the API
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      // The API endpoint is now /users/teachers/ as defined in the router
      const response = await api.get(
        `/users/teachers/?is_archived=${showArchived}`
      );
      setTeachers(response.data);
    } catch (error) {
      toast.error("O'qituvchilarni yuklashda xatolik yuz berdi.");
      console.error("Fetch Teachers Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showArchived]);

  // Effect to fetch data when the component mounts or the archive toggle changes
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Client-side filtering logic based on the search query
  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    return teachers.filter(
      (teacher) =>
        teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.phone_number.toString().includes(searchQuery)
    );
  }, [teachers, searchQuery]);

  const handleRowSelected = useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleArchiveToggle = async (teacher) => {
    const isArchiving = teacher.is_active;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/users/teachers/${teacher.id}/${action}/`);
      toast.success("Muvaffaqiyatli bajarildi", { id: toastId });
      fetchTeachers();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };

  const handleDelete = async (teacher) => {
    if (
      window.confirm(
        `${teacher.full_name} ni o'chirishga ishonchingiz komilmi?`
      )
    ) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/users/teachers/${teacher.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchTeachers();
      } catch (error) {
        toast.error("Xatolik yuz berdi", { id: toastId });
      }
    }
  };

  // --- FUNCTION TO OPEN THE POPUP ---
  const openActionPopup = (e, teacher) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true, // Set isOpen to true here
      teacher: teacher,
      referenceElement: e.currentTarget, // Store the button element itself
    });
  };

  const closeActionPopup = () => {
    setActionPopup({ isOpen: false, teacher: null, referenceElement: null });
  };

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat("fr-FR").format(num) + " so'm";
  };
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-GB");

  const columns = [
    { name: "№", selector: (row, i) => i + 1, width: "60px" },
    {
      name: "Rasm",
      cell: (row) =>
        row.profile_photo ? (
          <Avatar alt={row.full_name} src={row.profile_photo} />
          // <img
          //   src={row.profile_photo}
          //   alt={row.full_name}
          //   className="w-9 h-9 rounded-full object-cover"
          // />
        ) : (
          <Avatar {...stringAvatar(row.full_name)} />
          // <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
          //   <User size={18} className="text-gray-400" />
          // </div>
        ),
      width: "80px",
    },
    {
      name: "Ism Familiya",
      selector: (row) => row.full_name,
      sortable: true,
      cell: (row) => (
        <div className="font-medium truncate" style={{ minWidth: "180px" }}>
          {row.full_name}
        </div>
      ),
    },
    {
      name: "Telefon raqam",
      sortable: true,
      center: true,
      selector: (row) => `+${row.phone_number}`,
    },
    {
      name: "Doimiy oylik",
      selector: (row) => row.salary,
      sortable: true,
      center: true,
      cell: (row) => (
        <div className="w-full text-center">{formatCurrency(row.salary)}</div>
      ),
    },
    {
      name: "Foiz ulush (%)",
      selector: (row) => row.percentage || "-",
      sortable: true,
      center: true,
      cell: (row) => (
        <div className="text-center">
          {row.percentage ? `${row.percentage} %` : "-"}{" "}
        </div>
      ),
    },
    {
      name: "Aktiv Guruhlar",
      selector: (row) => row.active_groups_count,
      sortable: true,
      center: true,
    },
    {
      name: "Aktiv O'quvchilar",
      selector: (row) => row.active_students_count,
      sortable: true,
      center: true,
    },
    {
      name: "Ishga olingan sana",
      selector: (row) => row.enrollment_date,
      sortable: true,
      center: true,
      format: (row) => formatDate(row.enrollment_date),
    },
    {
      name: "Harakatlar",
      cell: (row) => (
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
      style: { overflow: "visible" },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Title and Count */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            O'qituvchilar
          </h1>
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            O'qituvchilar soni: {teachers.length} ta
          </span>
        </div>

        <div className="flex items-center flex-wrap justify-end gap-4">
          {/* Archive Toggle */}
          <div className="flex items-center space-x-2">
            <label
              htmlFor="archive-toggle"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Arxiv
            </label>
            <button
              id="archive-toggle"
              onClick={() => setShowArchived(!showArchived)}
              type="button"
              role="switch"
              aria-checked={showArchived}
              className={clsx(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                showArchived ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  showArchived ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidirish..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Action Buttons */}
          <button className="bg-white dark:bg-gray-700 border dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2">
            <MessageSquare size={16} />
            <span>Xabar Yuborish</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Yangi Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-blue-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <DataTable
          columns={columns}
          data={filteredTeachers}
          progressPending={isLoading}
          pagination
          paginationRowsPerPageOptions={[10, 30, 50, 100]}
          paginationComponentOptions={paginationComponentOptions}
          selectableRows
          selectableRowsHighlight
          highlightOnHover
          onSelectedRowsChange={handleRowSelected}
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          progressComponent={<ProgressComponent />}
          noDataComponent={<NoDataComponent />}
        />
      </div>

      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title={actionPopup.teacher?.full_name}
        actions={[
          // Define the specific actions for a teacher
          {
            label: "Ko'rish",
            icon: Eye,
            onClick: () => alert("Viewing " + actionPopup.teacher.full_name),
          },
          {
            label: "Tahrirlash",
            icon: Edit,
            onClick: () => handleEdit(actionPopup.teacher),
          },
          { label: "Xabar Yuborish", icon: MessageSquare, onClick: () => {} },
          { isSeparator: true },
          {
            label: actionPopup.teacher?.is_active
              ? "Arxivlash"
              : "Arxivdan chiqarish",
            icon: actionPopup.teacher?.is_active ? BiArchiveIn : BiArchiveOut,
            onClick: () => handleArchiveToggle(actionPopup.teacher),
            className: "text-orange-600 dark:text-orange-500",
          },
          {
            label: "O'chirish",
            icon: Trash2,
            onClick: () => handleDelete(actionPopup.teacher),
            className: "text-red-600 dark:text-red-500",
          },
        ]}
      />

      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        refreshTeachers={fetchTeachers}
      />
      {selectedTeacher && (
        <EditTeacherModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTeacher(null);
          }}
          refreshTeachers={fetchTeachers}
          teacher={selectedTeacher}
        />
      )}
    </div>
  );
};

export default TeachersPage;
