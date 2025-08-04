import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import {
  Plus,
  Search,
  User,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";
import clsx from "clsx";
import { useSettings } from "../context/SettingsContext";
import AddStaffModal from "../components/staff/AddStaffModal";
import EditStaffModal from "../components/staff/EditStaffModal";

// Import necessary child components
import ActionPopup from "../components/ui/ActionPopup";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  paginationComponentOptions,
  ProgressComponent,
} from "../data/dataTableStyles.jsx";
import Avatar from '@mui/material/Avatar';
import {stringAvatar} from "../components/ui/Avatar";

const StaffPage = () => {
  // --- STATE MANAGEMENT ---
  const { theme } = useSettings();
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);

  // State for modals and popups
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    user: null,
    referenceElement: null,
  });

  // --- DATA FETCHING ---
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    let params = { is_archived: showArchived };
    if (activeFilter !== "all") {
      params[`is_${activeFilter}`] = true;
    }
    try {
      const response = await api.get("/users/users/", { params });
      setUsers(response.data.results || response.data);
    } catch (error) {
      toast.error("Xodimlarni yuklashda xatolik.");
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, activeFilter]);

  // Fetch the role counts once when the component mounts
  useEffect(() => {
    api
      .get("/users/role-counts/")
      .then((res) => setCounts(res.data))
      .catch(() => toast.error("Rollarni yuklashda xatolik."));
  }, []);

  // Re-fetch the user list whenever the filters change
  useEffect(() => {
    // Debounce search input to avoid excessive API calls
    const handler = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms delay
    return () => clearTimeout(handler);
  }, [fetchUsers]);

  // Client-side filtering logic based on the search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone_number.toString().includes(searchQuery)
    );
  }, [users, searchQuery]);

  const handleRowSelected = useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  // --- EVENT HANDLERS ---
  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const openActionPopup = (e, user) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true,
      user: user,
      referenceElement: e.currentTarget,
    });
  };

  const handleArchiveToggle = async (user) => {
    const isArchiving = user.is_active;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/users/users/${user.id}/${action}/`);
      toast.success("Muvaffaqiyatli bajarildi", { id: toastId });
      fetchUsers();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };

  const handleDelete = async (user) => {
    if (
      window.confirm(`${user.full_name} ni o'chirishga ishonchingiz komilmi?`)
    ) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/users/users/${user.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchUsers();
      } catch (error) {
        toast.error("Xatolik yuz berdi", { id: toastId });
      }
    }
  };

  const closeActionPopup = () => {
    setActionPopup({ isOpen: false, user: null, referenceElement: null });
  };

  // --- FORMATTING HELPERS ---
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat("fr-FR").format(num) + " so'm";
  };
  const formatPhoneNumber = n => {
  const p = n.toString();
  return `+${p.slice(0,3)} (${p.slice(3,5)}) ${p.slice(5,8)}-${p.slice(8,10)}-${p.slice(10,12)}`;
};
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };
  const formatRoles = (roles) => {
    if (!roles || roles.length === 0) return "-";
    const roleTranslations = {
      Teacher: "O'qituvchi",
      Admin: "Admin",
      CEO: "CEO",
    };
    return roles.map((role) => roleTranslations[role] || role).join(", ");
  };

  // --- DATA TABLE COLUMNS ---
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
      name: "Telefon raqam",
      selector: (row) => formatPhoneNumber(row.phone_number),
      sortable: true,
    },
    {
      name: "Doimiy oylik",
      selector: (row) => row.salary,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="text-center">{formatCurrency(row.salary)}</span>
      ),
    },
    {
      name: "Foiz ulush (%)",
      selector: (row) => `${row.percentage || "-"}`,
      sortable: true,
      center: true,
      cell: (row) => (
        <div className="text-center">
          {row.percentage ? `${row.percentage} %` : "-"}{" "}
        </div>
      ),
    },
    {
      name: "Kasbi",
      selector: (row) => row.roles,
      sortable: true,
      cell: (row) => (
        <span className="font-semibold capitalize">
          {formatRoles(row.roles)}
        </span>
      ),
    },
    {
      name: "Ishga olingan sana",
      center: true,
      selector: (row) => row.enrollment_date,
      sortable: true,
      format: (row) => formatDate(row.enrollment_date),
    },
    {
      name: "Harakatlar",
      cell: (row) => (
        <button
          onClick={(e) => openActionPopup(e, row)}
          className="p-2 -m-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MoreVertical size={20} />
        </button>
      ),
      ignoreRowClick: true,
      center: true,
      style: { overflow: "visible" },
    },
  ];

  const FilterButton = ({ filterKey, label }) => {
    const currentCounts = showArchived ? counts?.archived : counts?.active;
    const count = currentCounts ? currentCounts[filterKey] : 0;
    return (
      <button
        onClick={() => setActiveFilter(filterKey)}
        className={clsx(
          "px-4 py-2 text-sm font-medium rounded-md border whitespace-nowrap",
          activeFilter === filterKey
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-gray-800 ..."
        )}
      >
        {label} - {count}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* --- THIS IS THE DEFINITIVE HEADER FIX --- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Xodimlar
          </h1>
        </div>
        <div className="flex items-center flex-wrap justify-end gap-4">
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {counts ? (
            <>
              <FilterButton filterKey="all" label="Barchasi" />
              <FilterButton filterKey="admin" label="Admin" />
              <FilterButton filterKey="teacher" label="O'qituvchi" />
              <FilterButton filterKey="ceo" label="CEO" />
            </>
          ) : (
            <div className="h-9 w-96 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          )}
        </div>
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
      </div>

      <div className="bg-white dark:bg-blue-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-tertiary">
        <DataTable
          columns={columns}
          data={filteredUsers} // Use the unfiltered data here, as DataTable handles sorting
          progressPending={isLoading}
          pagination
          paginationRowsPerPageOptions={[10, 30, 50, 100]}
          paginationComponentOptions={paginationComponentOptions}
          highlightOnHover
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={handleRowSelected}
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          progressComponent={<ProgressComponent />}
          noDataComponent={<NoDataComponent />}
          // No need for client-side filtering if backend handles search
        />
      </div>

      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        refreshUsers={fetchUsers}
        title="Yangi Xodim Qo'shish"
        // No default userRole prop, so the modal will show role checkboxes
      />
      {selectedUser && (
        <EditStaffModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          refreshUsers={fetchUsers}
          user={selectedUser}
        />
      )}

      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title={actionPopup.user?.full_name}
        actions={[
          // Define the specific actions for a teacher
          {
            label: "Ko'rish",
            icon: Eye,
            onClick: () => alert("Viewing " + actionPopup.user.full_name),
          },
          {
            label: "Tahrirlash",
            icon: Edit,
            onClick: () => handleEdit(actionPopup.user),
          },
          { label: "Xabar Yuborish", icon: MessageSquare, onClick: () => {} },
          { isSeparator: true },
          {
            label: actionPopup.user?.is_active
              ? "Arxivlash"
              : "Arxivdan chiqarish",
            icon: actionPopup.user?.is_active ? BiArchiveIn : BiArchiveOut,
            onClick: () => handleArchiveToggle(actionPopup.user),
            className: "text-orange-600 dark:text-orange-500",
          },
          {
            label: "O'chirish",
            icon: Trash2,
            onClick: () => handleDelete(actionPopup.user),
            className: "text-red-600 dark:text-red-500",
          },
        ]}
      />
    </div>
  );
};

export default StaffPage;
