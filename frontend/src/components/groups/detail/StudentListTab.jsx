import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTable from "react-data-table-component";
import { useSettings } from "../../../context/SettingsContext";
import { useAuth } from "../../../context/AuthContext";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  ProgressComponent,
  paginationComponentOptions,
} from "../../../data/dataTableStyles.jsx";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  DollarSign,
  LogOut,
  Trash2,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import dayjs from "dayjs";

import Avatar from "@mui/material/Avatar";
import { stringAvatar } from "../../ui/Avatar.jsx";

import ActionPopup from "../../ui/ActionPopup";
import RemoveFromGroupModal from "./RemoveFromGroupModal";
import EditEnrollmentModal from "./EditEnrollmentModal";
import AddPaymentModal from "../../finance/AddPaymentModal";

const StudentListTab = ({ group, refreshGroupDetails }) => {
  const { theme } = useSettings();
  const { user: currentUser } = useAuth();
  const isManager =
    currentUser.roles.includes("Admin") || currentUser.roles.includes("CEO");

  const [allEnrollments, setAllEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    data: null,
    referenceElement: null,
  });

  // State for modals
  const [modalState, setModalState] = useState({
        remove: null, // will hold enrollment object
        payment: null, // will hold { student, group } objects
        edit: null, // will hold enrollment object
    });
    
  const [removeModal, setRemoveModal] = useState({
    isOpen: false,
    enrollment: null,
  });
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    student: null,
    group: null,
  });
  const [editEnrollmentModal, setEditEnrollmentModal] = useState({
    isOpen: false,
    enrollment: null,
  });

  const fetchAllEnrollments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        group: group.id,
        is_archived: showArchived,
      };
      const response = await api.get("/core/enrollments/", { params });
      setAllEnrollments(response.data.results || response.data);
    } catch {
      toast.error("O'quvchilar ro'yxatini yuklashda xatolik.");
    } finally {
      setIsLoading(false);
    }
  }, [group.id, showArchived]);

  useEffect(() => {
    fetchAllEnrollments();
  }, [fetchAllEnrollments]);

  const filteredEnrollments = useMemo(() => {
    if (!searchQuery) {
      return allEnrollments;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    return allEnrollments.filter(
      (enrollment) =>
        enrollment.student_full_name.toLowerCase().includes(lowerCaseQuery) ||
        enrollment.student_phone_number.toString().includes(lowerCaseQuery)
    );
  }, [allEnrollments, searchQuery]);


  const handleRemove = (enrollment) =>
    setModalState(prev => ({ ...prev, remove: enrollment }));

  const handleEdit = (enrollment) => {
    setModalState(prev => ({ ...prev, edit: enrollment }));
  };

  const handleAddPayment = (enrollment) => {
    const studentForModal = {
      id: enrollment.student_id,
      full_name: enrollment.student_full_name,
      phone_number: enrollment.student_phone_number,
    };
    setModalState(prev => ({ ...prev, payment: { student: studentForModal, group: enrollment.id } }));
  };

  const handleDelete = async (enrollment) => {
    if (
      window.confirm(
        "Bu o'quvchini guruhdan butunlay o'chirishga ishonchingiz komilmi? Ushbu o'quvchining barcha to'lovlari o'chadi! Bu amalni orqaga qaytarib bo'lmaydi."
      )
    ) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/core/enrollments/${enrollment.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        refreshGroupDetails();
      } catch {
        toast.error("Xatolik yuz berdi", { id: toastId });
      }
    }
  };

  const handleRestore = async (enrollment) => {
    if (
      window.confirm(
        "Ushbu o'quvchini guruhga qayta tiklamoqchimisiz? Bunda o'quvchi arxivdan chiqariladi."
      )
    ) {
      const toastId = toast.loading("Qayta tiklanmoqda...");
      try {
        await api.post(`/core/enrollments/${enrollment.id}/restore/`);
        toast.success("Muvaffaqiyatli guruhga qayta qo'shildi", {
          id: toastId,
        });
        refreshGroupDetails();
      } catch {
        toast.error("Xatolik yuz berdi", { id: toastId });
      }
    }
  };

  const openActionPopup = (e, enrollment) => {
    setActionPopup({
      isOpen: true,
      data: enrollment,
      referenceElement: e.currentTarget,
    });
  };

  const closeActionPopup = () =>
    setActionPopup({ isOpen: false, data: null, referenceElement: null });

  const actions = useMemo(() => {
    const enrollment = actionPopup.data;
    if (!enrollment) return [];

    const getActions = (enrollment) => {
      let actions = [{ label: "Ko'rish", icon: Eye, onClick: () => {} }];
      if (isManager) {
        if (enrollment.is_archived) {
          // Actions for ARCHIVED students
          actions.push({
            label: "Tiklash",
            icon: RefreshCw,
            onClick: () => handleRestore(enrollment),
            className: "text-green-500",
          });
        } else {
          // Actions for ACTIVE students
          actions.push(
            {
              label: "Tahrirlash",
              icon: Edit,
              onClick: () => handleEdit(enrollment),
            },
            {
              label: "To'lov",
              icon: DollarSign,
              onClick: () => handleAddPayment(enrollment),
            },
            { isSeparator: true },
            {
              label: "Guruhdan chiqarish",
              icon: LogOut,
              onClick: () => handleRemove(enrollment),
              className: "text-orange-500",
            },
            {
              label: "Butunlay o'chirish",
              icon: Trash2,
              onClick: () => handleDelete(enrollment),
              className: "text-red-500",
            }
          );
        }
      }
      return actions;
    };

    return getActions(enrollment);
  }, [actionPopup.data]);

  const columns = useMemo(() => {
    const baseColumns = [
      { name: "№", selector: (row, i) => i + 1, width: "60px" },
      {
        name: "Rasm",
        cell: (row) =>
          row.student_profile_photo ? (
            <Avatar
              alt={row.student_full_name}
              src={row.student_profile_photo}
            />
          ) : (
            <Avatar {...stringAvatar(row.student_full_name)} />
          ),
        width: "80px",
      },
      {
        name: "Ism familiya",
        selector: (row) => row.student_full_name,
        sortable: true,
      },
      {
        name: "Telefon raqam",
        selector: (row) => `+${row.student_phone_number}`,
        sortable: true,
      },
      {
        name: "Balans",
        selector: (row) => row.current_balance,
        sortable: true,
        cell: (row) => (
          <span
            className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium",
              row.current_balance >= 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {new Intl.NumberFormat("fr-FR").format(row.current_balance || 0)}{" "}
            so'm
          </span>
        ),
      },
      {
        name: "Maxsus narx",
        selector: (row) =>
          row.price
            ? `${new Intl.NumberFormat("fr-FR").format(row.price)} so'm`
            : "yo'q",
        sortable: true,
      },
      {
        name: "Qo'shilgan sana",
        selector: (row) => row.joined_at,
        sortable: true,
        format: (row) => dayjs(row.joined_at).format("DD/MM/YYYY"),
      },
    ];

    if (showArchived) {
      baseColumns.push({
        name: "Chiqqan sana",
        selector: (row) => row.archived_at,
        sortable: true,
        format: (row) => dayjs(row.archived_time).format("DD/MM/YYYY"),
      });
    }

    baseColumns.push({
      name: "Harakatlar",
      cell: (row) => (
        <button onClick={(e) => openActionPopup(e, row)}>
          <MoreVertical />
        </button>
      ),
      ignoreRowClick: true,
      center: true,
      style: { overflow: "visible" },
    });
    return baseColumns;
  }, [showArchived, isManager]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative">
          <input
            type="text"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qidirish..."
            className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex items-center space-x-2">
          <label>Arxiv</label>
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
      </div>

      <DataTable
        columns={columns}
        data={filteredEnrollments}
        progressPending={isLoading}
        responsive
        pagination
        highlightOnHover
        striped
        customStyles={theme === "dark" ? darkThemeStyles : customStyles}
        noDataComponent={<NoDataComponent />}
        progressComponent={<ProgressComponent />}
        paginationComponentOptions={paginationComponentOptions}
        paginationRowsPerPageOptions={[10, 30, 50, 100]}
      />

      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title={actionPopup.data?.student_full_name}
        actions={actions}
      />

      <RemoveFromGroupModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, enrollment: null })}
        refreshData={refreshGroupDetails}
        enrollment={removeModal.enrollment}
      />
      {modalState.payment && (
        <AddPaymentModal
          isOpen={!!modalState.payment}
          onClose={() => setModalState(prev => ({...prev, payment: null}))}
          initialStudent={{
            value: modalState.payment.student.id,
            label: `${modalState.payment.student.full_name} (+${modalState.payment.student.phone_number})`,
          }}
          initialGroup={modalState.payment.group}
        />
      )}

      {modalState.edit && (
        <EditEnrollmentModal
          isOpen={!!modalState.edit}
          onClose={() =>
            setModalState(prev => ({...prev, edit: null}))}
          refreshData={() => {
            fetchAllEnrollments();
            refreshGroupDetails();
          }}
          enrollment={modalState.edit}
        />
      )}
    </div>
  );
};

export default StudentListTab;
