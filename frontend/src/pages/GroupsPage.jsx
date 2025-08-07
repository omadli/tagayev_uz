import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserPlus,
  Receipt,
  CalendarCog,
} from "lucide-react";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";
import Select from "react-select";
import { Link } from "react-router-dom";

// Import UI and Data Components
import ActionPopup from "../components/ui/ActionPopup";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  paginationComponentOptions,
  ProgressComponent,
} from "../data/dataTableStyles.jsx";
import AddGroupModal from "../components/groups/AddGroupModal";
import EditGroupModal from "../components/groups/EditGroupModal";
import PriceChangeModal from "../components/groups/PriceChangeModal";
import AddStudentToGroupModal from "../components/groups/AddStudentToGroupModal";

// --- HELPER FUNCTION FOR WEEKDAYS ---
const formatWeekdays = (weekdays) => {
  if (!weekdays) return "-";
  if (weekdays === "135") return "Toq kunlar";
  if (weekdays === "246") return "Juft kunlar";
  if (weekdays === "1234567") return "Har kuni";

  const weekdayMap = {
    1: "Dush",
    2: "Sesh",
    3: "Chor",
    4: "Pay",
    5: "Jum",
    6: "Shan",
    7: "Yak",
  };
  return weekdays
    .split("")
    .map((day) => weekdayMap[day] || "")
    .join("/");
};

const GroupsPage = ({ isTeacherMyGroupsPage = false }) => {
  const { theme, selectedBranchId } = useSettings();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // --- STATE MANAGEMENT ---
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    is_archived: false,
    branch: selectedBranchId || null, // This should come from a context or global state
    teacher: isTeacherMyGroupsPage
      ? currentUser.user_id
      : searchParams.get("teacher") || null,
    room: searchParams.get("room") || null,
    weekdays: null,
  });
  // State for filter dropdowns
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    data: null,
    referenceElement: null,
  });

  const hasFetchedInitialData = useRef(false);

  useEffect(() => {
    if (selectedBranchId) {
      setFilters((prev) => ({ ...prev, branch: selectedBranchId }));
    }
  }, [selectedBranchId]);

  // --- DATA FETCHING ---
  const fetchGroups = useCallback(async () => {
    if (!filters.branch) {
      setGroups([]); // Optionally clear data if no branch is selected
      setIsLoading(false); // We are done "loading" for now
      return;
    }
    setIsLoading(true);
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== "")
    );
    try {
      const response = await api.get("/core/groups/", {
        params: activeFilters,
      });
      setGroups(response.data.results || response.data);
    } catch (error) {
      toast.error("Guruhlarni yuklashda xatolik yuz berdi.");
      console.error("Fetch Groups Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch data for the filter dropdowns once
  useEffect(() => {
    if (hasFetchedInitialData.current) {
      return;
    }
    const fetchFilterData = async () => {
      if (!selectedBranchId) return;
      try {
        const [teachersRes, roomsRes] = await Promise.all([
          api.get("/users/teachers/?is_archived=false"),
          api.get(`/core/rooms/?branch=${selectedBranchId}`), // Assuming a /core/rooms/ endpoint exists
        ]);
        setTeachers(
          teachersRes.data.map((t) => ({ value: t.id, label: t.full_name }))
        );
        setRooms(roomsRes.data.map((r) => ({ value: r.id, label: r.name })));
        hasFetchedInitialData.current = true;
      } catch (error) {
        toast.error("Filtr ma'lumotlarini yuklashda xatolik.");
      }
    };
    fetchFilterData();
  }, [selectedBranchId]);

  // Re-fetch groups when filters change
  useEffect(() => {
    const handler = setTimeout(() => fetchGroups(), 300);
    return () => clearTimeout(handler);
  }, [fetchGroups]);

  // --- EVENT HANDLERS ---
  const handleFilterChange = (name, selectedOption) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : null,
    }));
  };

  const openActionPopup = (e, group) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true,
      data: group,
      referenceElement: e.currentTarget,
    });
  };
  const closeActionPopup = () => {
    setActionPopup({ isOpen: false, data: null, referenceElement: null });
  };

  const handleView = (group) => {
    if(group && group.id){
      navigate(`/${ isTeacherMyGroupsPage ? 'mygroups': 'groups'}/${group.id}`);
    }
  }
    

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handlePriceChange = (group) => {
    setSelectedGroup(group);
    setIsPriceModalOpen(true);
  };

  const handleAddStudent = (group) => {
    setSelectedGroup(group);
    setIsAddStudentModalOpen(true);
  };

  const handleArchive = async (group) => {
    const isArchiving = !group.is_archived;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/core/groups/${group.id}/${action}/`);
      toast.success(
        `${group.name} - ${group.teacher_name} ${
          isArchiving ? "arxivlandi" : "tiklandi"
        }.`,
        { id: toastId }
      );
      fetchGroups();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.[0] ||
        "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleDelete = async (group) => {
    if (window.confirm(`${group.name} ni o'chirishga ishonchingiz komilmi?`)) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/core/groups/${group.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchGroups();
      } catch (error) {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.[0] ||
          "Xatolik yuz berdi";
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  const selectedRoomOption = useMemo(
    () => rooms.find((option) => option.value == filters.room) || null,
    [filters.room, rooms]
  );
  const selectedTeacherOption = useMemo(
    () => teachers.find((option) => option.value == filters.teacher) || null,
    [filters.teacher, teachers]
  );

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-GB");

  // --- DATA TABLE COLUMNS ---
  const columns = useMemo(() => {
    const baseColumns = [
      { name: "№", selector: (row, i) => i + 1, width: "60px" },
      {
        name: "Guruh nomi",
        selector: (row) => row.name,
        sortable: true,
        cell: (row) => (
          <div className="flex items-center space-x-3 py-2" onClick={() => handleView(row)}>
            <span
              style={{ backgroundColor: row.color }}
              className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600"
            ></span>
            <span
              style={{ color: theme === "dark" ? row.text_color : "inherit" }}
              className="font-semibold"
            >
              {row.name}
            </span>
          </div>
        ),
      },
    ];

    const teacherColumn = {
      name: "O'qituvchi",
      selector: (row) => row.teacher_name,
      sortable: true,
    };
    const remainingColumns = [
      {
        name: "Hafta kunlari",
        selector: (row) => row.weekdays,
        cell: (row) => formatWeekdays(row.weekdays),
        sortable: true,
      },
      {
        name: "Vaqti",
        selector: (row) => row.course_start_time,
        cell: (row) =>
          `${row.course_start_time.slice(0, 5)} - ${row.course_end_time.slice(
            0,
            5
          )}`,
        sortable: true,
      },
      { name: "Xona", selector: (row) => row.room_name, sortable: true },
      {
        name: "Narxi",
        selector: (row) => row.current_price,
        format: (row) =>
          `${new Intl.NumberFormat("fr-FR").format(
            row.current_price || 0
          )} so'm`,
        sortable: true,
      },
      {
        name: "O'quvchilar soni",
        selector: (row) => row.students_count,
        center: true,
        sortable: true,
      },
      {
        name: "Ochilgan",
        selector: (row) => row.start_date,
        center: true,
        sortable: true,
        format: (row) => formatDate(row.start_date),
      },
      {
        name: "Yakunlanadi",
        selector: (row) => row.end_date,
        center: true,
        sortable: true,
        format: (row) => formatDate(row.end_date),
      },
    ];

    const actionsColumn = {
      name: "Harakatlar",
      cell: (row) => (
        <button onClick={(e) => openActionPopup(e, row)}>
          <MoreVertical size={20} />
        </button>
      ),
      ignoreRowClick: true,
      center: true,
      style: { overflow: "visible" },
    };

    let finalColumns = [...baseColumns];

    if (!isTeacherMyGroupsPage) {
      finalColumns.push(teacherColumn);
    }

    finalColumns = [...finalColumns, ...remainingColumns];

    if (!isTeacherMyGroupsPage) {
      finalColumns.push(actionsColumn);
    }

    return finalColumns;
  }, [isTeacherMyGroupsPage, theme]);

  const weekdayFilterOptions = [
    { value: "135", label: "Toq kunlar" },
    { value: "246", label: "Juft kunlar" },
    { value: "1234567", label: "Har kuni" },
  ];

  return (
    // The root div now provides the spacing, not a separate layout component
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-text-light-primary">
            {isTeacherMyGroupsPage ? "Mening Guruhlarim" : "Guruhlar"}
          </h1>
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            Guruhlar soni: {groups.length} ta
          </span>
        </div>
        {!isTeacherMyGroupsPage && (
          <div className="flex items-center flex-wrap justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Yangi Qo'shish</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-secondary p-4 rounded-lg shadow-sm border dark:border-dark-tertiary">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative col-span-2 lg:col-span-1">
            <input
              type="text"
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <Select
            placeholder="Hafta kunlari"
            options={weekdayFilterOptions}
            isClearable
            onChange={(opt) => handleFilterChange("weekdays", opt)}
          />
          <Select
            placeholder="Xona"
            options={rooms}
            value={selectedRoomOption}
            isClearable
            onChange={(opt) => handleFilterChange("room", opt)}
          />
          {!isTeacherMyGroupsPage && (
            <Select
              placeholder="O'qituvchi"
              options={teachers}
              value={selectedTeacherOption}
              isClearable
              onChange={(opt) => handleFilterChange("teacher", opt)}
            />
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

      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-md border border-gray-200 dark:border-dark-tertiary">
        <DataTable
          columns={columns}
          data={groups}
          progressPending={isLoading}
          responsive
          pagination
          highlightOnHover
          selectableRows
          selectableRowsHighlight
          pointerOnHover
          onRowClicked={(row) => handleView(row)}
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          progressComponent={<ProgressComponent />}
          noDataComponent={<NoDataComponent />}
          paginationComponentOptions={paginationComponentOptions}
          paginationRowsPerPageOptions={[10, 30, 50, 100]}
        />
      </div>

      {!isTeacherMyGroupsPage && (
        <ActionPopup
          isOpen={actionPopup.isOpen}
          onClose={closeActionPopup}
          referenceElement={actionPopup.referenceElement}
          title={
            actionPopup.data
              ? `${actionPopup.data.name} - ${actionPopup.data.teacher_name}`
              : "Guruh"
          }
          actions={[
            {
              label: "Ko'rish",
              icon: Eye,
              onClick: () => handleView(actionPopup.data),
            },
            {
              label: "Tahrirlash",
              icon: Edit,
              onClick: () => handleEdit(actionPopup.data),
            },
            {
              label: "Narx o'zgartirish",
              icon: Receipt,
              onClick: () => handlePriceChange(actionPopup.data),
            },
            {
              label: "Dars kuni/vaqtini o'zgartirish",
              icon: CalendarCog,
              onClick: () => {},
            },
            {
              label: "O'quvchi kiritish",
              icon: UserPlus,
              onClick: () => handleAddStudent(actionPopup.data),
            },
            { isSeparator: true },
            {
              label: !actionPopup.data?.is_archived
                ? "Arxivlash"
                : "Arxivdan chiqarish",
              icon: !actionPopup.data?.is_archived ? BiArchiveIn : BiArchiveOut,
              onClick: () => handleArchive(actionPopup.data),
              className: "text-orange-600 dark:text-orange-500",
            },
            {
              label: "O'chirish",
              icon: Trash2,
              className: "text-red-600",
              onClick: () => handleDelete(actionPopup.data),
            },
          ]}
        />
      )}

      {!isTeacherMyGroupsPage && (
        <AddGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          refreshGroups={fetchGroups}
          selectedBranchId={filters.branch}
        />
      )}

      {!isTeacherMyGroupsPage && selectedGroup && (
        <EditGroupModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGroup(null);
          }}
          refreshGroups={fetchGroups}
          group={selectedGroup}
          selectedBranchId={filters.branch}
        />
      )}

      {!isTeacherMyGroupsPage && selectedGroup && (
        <PriceChangeModal
          isOpen={isPriceModalOpen}
          onClose={() => {
            setIsPriceModalOpen(false);
            setSelectedGroup(null);
          }}
          refreshGroups={fetchGroups}
          group={selectedGroup}
        />
      )}

      {selectedGroup && (
        <AddStudentToGroupModal
          isOpen={isAddStudentModalOpen}
          onClose={() => {
            setIsAddStudentModalOpen(false);
            setSelectedGroup(null);
          }}
          refreshGroups={fetchGroups}
          group={selectedGroup}
        />
      )}
    </div>
  );
};

export default GroupsPage;
