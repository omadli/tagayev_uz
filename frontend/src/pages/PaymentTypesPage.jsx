import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useSettings } from "../context/SettingsContext";
import { Plus, Search, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  ProgressComponent,
  paginationComponentOptions,
} from "../data/dataTableStyles.jsx";
import ActionPopup from "../components/ui/ActionPopup";
import PaymentTypeModal from "../components/payment-types/PaymentTypeModal";
import dayjs from "dayjs";

const PaymentTypesPage = () => {
  const { theme } = useSettings();
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    data: null,
    referenceElement: null,
  });

  const fetchPaymentTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/finance/payment-types/");
      setPaymentTypes(response.data);
    } catch (error) {
      toast.error("To'lov turlarini yuklashda xatolik.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentTypes();
  }, [fetchPaymentTypes]);

  const handleAdd = () => {
    setSelectedPaymentType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pt) => {
    setSelectedPaymentType(pt);
    setIsModalOpen(true);
  };

  const openActionPopup = (e, payment_type) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true,
      data: payment_type,
      referenceElement: e.currentTarget,
    });
  };

  const closeActionPopup = () =>
    setActionPopup({ isOpen: false, data: null, referenceElement: null });

  const handleDelete = async (pt) => {
    if (
      window.confirm(
        `"${pt.name}" to'lov turini o'chirishga ishonchingiz komilmi?`
      )
    ) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/finance/payment-types/${pt.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchPaymentTypes();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Xatolik yuz berdi", {
          id: toastId,
        });
      }
    }
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat("fr-FR").format(num || 0) + " so'm";
  const currentMonthName = dayjs().format("MMMM");
  const lastMonthName = dayjs().subtract(1, "month").format("MMMM");

  const columns = [
    { name: "№", selector: (row, i) => i + 1, width: "60px" },
    {
      name: "Nomi",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => <div className="font-medium truncate">{row.name}</div>,
    },
    {
      name: `Joriy oy (${currentMonthName})`,
      selector: (row) => row.current_month_total,
      sortable: true,
      format: (row) => formatCurrency(row.current_month_total),
    },
    {
      name: `O'tgan oy (${lastMonthName})`,
      selector: (row) => row.last_month_total,
      sortable: true,
      format: (row) => formatCurrency(row.last_month_total),
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
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap  justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">To'lov Turlari</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={16} /> Yangi Qo'shish
        </button>
      </div>
      <div className="bg-white dark:bg-blue-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-tertiary">
        <DataTable
          columns={columns}
          data={paymentTypes}
          progressPending={isLoading}
          pagination
          paginationRowsPerPageOptions={[10, 30, 50, 100]}
          paginationComponentOptions={paginationComponentOptions}
          highlightOnHover
          customStyles={theme === "dark" ? darkThemeStyles : customStyles}
          noDataComponent={<NoDataComponent />}
          progressComponent={<ProgressComponent />}
        />
      </div>
      <PaymentTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refreshPaymentTypes={fetchPaymentTypes}
        paymentType={selectedPaymentType}
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
export default PaymentTypesPage;
