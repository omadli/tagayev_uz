import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useSettings } from "../context/SettingsContext";
import { Plus, Search, Eye, Edit, Trash2, MoreVertical } from "lucide-react";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";
import clsx from "clsx";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
} from "../data/dataTableStyles.jsx";
import ActionPopup from "../components/ui/ActionPopup";
import RoomModal from "../components/rooms/RoomModal"; // Import the new modal

const RoomsPage = () => {
  const { theme, selectedBranchId } = useSettings();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for the modal (Add/Edit) and popup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Used for editing
  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    data: null,
    referenceElement: null,
  });

  const fetchRooms = useCallback(async () => {
    if (!selectedBranchId) return; // Don't fetch if no branch is selected
    setIsLoading(true);
    try {
      const params = {
        is_archived: showArchived,
        branch: selectedBranchId,
        search: searchQuery,
      };
      const response = await api.get("/core/rooms/", { params });
      setRooms(response.data.results || response.data);
    } catch (error) {
      toast.error("Xonalarni yuklashda xatolik.");
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, selectedBranchId, searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => fetchRooms(), 300);
    return () => clearTimeout(handler);
  }, [fetchRooms]);

  const handleAdd = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };
  const handleEdit = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };
  const handleArchive = async (room) => {
    const isArchiving = !room.is_archived;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/core/rooms/${room.id}/${action}/`);
      toast.success(
        `${room.name} ${isArchiving ? "arxivlandi" : "tiklandi"}.`,
        { id: toastId }
      );
      fetchRooms();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.[0] ||
        "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };
  const handleDelete = async (room) => {
    if (window.confirm(`${room.name} ni o'chirishga ishonchingiz komilmi?`)) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/core/rooms/${room.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchRooms();
      } catch (error) {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.[0] ||
          "Xatolik yuz berdi";
        toast.error(errorMsg, { id: toastId });
      }
    }
  };
  const openActionPopup = (e, room) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true,
      data: room,
      referenceElement: e.currentTarget,
    });
  };
  const closeActionPopup = () => {
    setActionPopup({ isOpen: false, data: null, referenceElement: null });
  };

  const columns = [
    { name: "№", selector: (row, i) => i + 1, width: "60px" },
    { name: "Xona", selector: (row) => row.name, sortable: true },
    {
      name: "Sig'imi",
      selector: (row) => `${row.capacity} ta`,
      sortable: true,
      center: true,
    },
    {
      name: "Guruhlar soni",
      selector: (row) => row.active_groups_count,
      sortable: true,
      center: true,
    },
    {
      name: "Qo'shimcha ma'lumotlar",
      selector: (row) => row.extra_info || "-",
      grow: 2,
    },
    {
      name: "Harakatlar",
      cell: (row) => (
        <button onClick={(e) => openActionPopup(e, row)}>
          <MoreVertical size={20} />
        </button>
      ),
      ignoreRowClick: true,
      center: true,
      style: { overflow: "visible" },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Xonalar</h1>
        <div className="flex items-center gap-4">
          <div className="relative col-span-2 lg:col-span-1">
            <input
              type="text"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <label className="text-sm font-medium">Arxiv</label>
            <button
              id="archive-toggle"
              onClick={() => setShowArchived(!showArchived)}
              type="button"
              role="switch"
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
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus /> Yangi Qo'shish
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-md border border-gray-200 dark:border-dark-tertiary">
        <DataTable
          columns={columns}
          data={rooms}
          progressPending={isLoading}
          pagination
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          noDataComponent={<NoDataComponent />}
        />
      </div>

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refreshRooms={fetchRooms}
        room={selectedRoom}
        selectedBranchId={selectedBranchId}
      />
      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title={actionPopup.data ? `${actionPopup.data.name}` : "Xona"}
        actions={[
          {
            label: "Guruhlarni ko'rish",
            icon: Eye,
            onClick: () => {},
          },
          {
            label: "Tahrirlash",
            icon: Edit,
            onClick: () => handleEdit(actionPopup.data),
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
    </div>
  );
};

export default RoomsPage;
