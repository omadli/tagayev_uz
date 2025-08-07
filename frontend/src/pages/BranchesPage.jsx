import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";
import DataTable from "react-data-table-component";
import { useSettings } from "../context/SettingsContext";
import { Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  ProgressComponent,
  paginationComponentOptions,
} from "../data/dataTableStyles.jsx";
import ActionPopup from "../components/ui/ActionPopup";
import BranchModal from "../components/branches/BranchModal";

const BranchesPage = () => {
  const { theme } = useSettings();
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    data: null,
    referenceElement: null,
  });

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        is_archived: showArchived,
      };
      const response = await api.get("/core/branches/", { params });
      setBranches(response.data.results || response.data);
    } catch (error) {
      toast.error(`Xonalarni yuklashda xatolik. ${error.data?.detail}`);
    } finally {
      setIsLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    const handler = setTimeout(() => fetchBranches(), 300);
    return () => clearTimeout(handler);
  }, [fetchBranches]);

  const filteredBranches = useMemo(() => {
    if (!searchQuery) {
      return branches;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(lowerCaseQuery) ||
        branch.address.toLowerCase().includes(lowerCaseQuery) ||
        branch.extra_info.toString().includes(lowerCaseQuery)
    );
  }, [branches, searchQuery]);

  const handleAdd = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleArchive = async (branch) => {
    const isArchiving = !branch.is_archived;
    const action = isArchiving ? "archive" : "restore";
    const toastId = toast.loading(
      `${isArchiving ? "Arxivlanmoqda" : "Tiklanmoqda"}...`
    );
    try {
      await api.post(`/core/branches/${branch.id}/${action}/`);
      toast.success(
        `${branch.name} ${isArchiving ? "arxivlandi" : "tiklandi"}.`,
        { id: toastId }
      );
      fetchBranches();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.[0] ||
        "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleDelete = async (branch) => {
    if (window.confirm(`${branch.name} ni o'chirishga ishonchingiz komilmi?`)) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/core/branches/${branch.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchBranches();
      } catch (error) {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.[0] ||
          "Xatolik yuz berdi";
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const openActionPopup = (e, branch) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true,
      data: branch,
      referenceElement: e.currentTarget,
    });
  };

  const closeActionPopup = () => {
    setActionPopup({ isOpen: false, data: null, referenceElement: null });
  };

  const columns = [
    { name: "№", selector: (row, i) => i + 1, width: "60px" },
    {
      name: "Filial",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => <div className="font-medium truncate">{row.name}</div>,
    },
    {
      name: "Manzil",
      selector: (row) => row.address,
      grow: 2,
      reorder: true,
      sortable: true,
    },
    {
      name: "Faol Guruhlar",
      selector: (row) => `${row.active_groups_count} ta`,
      sortable: true,
      center: true,
      reorder: true,
    },
    {
      name: "Faol O'quvchilar",
      selector: (row) => `${row.active_students_count} ta`,
      sortable: true,
      center: true,
      reorder: true,
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Filiallar</h1>
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
          data={filteredBranches}
          progressPending={isLoading}
          pagination
          paginationRowsPerPageOptions={[10, 30, 50, 100]}
          paginationComponentOptions={paginationComponentOptions}
          highlightOnHover
          selectableRows
          selectableRowsHighlight
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          noDataComponent={<NoDataComponent />}
          progressComponent={<ProgressComponent />}
        />
      </div>

      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refreshBranches={fetchBranches}
        branch={selectedBranch}
      />
      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title={actionPopup.data ? `${actionPopup.data.name}` : "Xona"}
        actions={[
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

export default BranchesPage;
