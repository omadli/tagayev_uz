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
  Info,
  Sheet,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Receipt,
  CalendarCog,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { getMuiTheme } from "../theme/muiTheme";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";
import dayjs from "dayjs";
import Select from "react-select";

// Import UI and Data Components
import ActionPopup from "../components/ui/ActionPopup";
import {
  customStyles,
  darkThemeStyles,
  NoDataComponent,
  paginationComponentOptions,
  ProgressComponent,
} from "../data/dataTableStyles.jsx";
import { ThemeProvider } from "@mui/material/styles";
import {
  Tooltip,
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AddPaymentModal from "../components/finance/AddPaymentModal.jsx";
// import EditPaymentModal from "../components/payments/EditPaymentModal";

const PaymentsPage = () => {
  const { theme, selectedBranchId } = useSettings();
  const muiTheme = getMuiTheme(theme);
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // --- STATE MANAGEMENT ---
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "PAYMENT",
    branch: selectedBranchId || null,
    receiver: searchParams.get("receiver") || null,
    group: searchParams.get("group") || null,
    student: searchParams.get("student") || null,
    payment_type: searchParams.get("payment_type") || null,
    start_date: searchParams.get("start_date")
      ? dayjs(searchParams.get("start_date"))
      : dayjs().startOf("month"),
    end_date: searchParams.get("end_date")
      ? dayjs(searchParams.get("end_date"))
      : dayjs(),
  });
  // State for filter dropdowns
  const [receivers, setReceivers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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
  const fetchPayments = useCallback(async () => {
    if (!filters.branch) {
      setPayments([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const activeFilters = Object.fromEntries(
      Object.entries(filters)
        .filter(([key, v]) => v !== null && v !== "")
        .map(([key, v]) => [
          key,
          v instanceof dayjs ? v.format("YYYY-MM-DD") : v,
        ])
    );
    try {
      const response = await api.get("/finance/transactions/", {
        params: activeFilters,
      });
      const paymentsData = response.data.results || response.data;
      setPayments(paymentsData);
      const total =
        paymentsData.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
      setTotalAmount(total);
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.[0] ||
        "To'lovlarni yuklashda xatolik yuz berdi.";
      toast.error(errorMsg);
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
        const [receiversRes, groupsRes, paymentTypesRes, studentsRes] =
          await Promise.all([
            api.get("/users/users/?is_archived=false"),
            api.get(`/core/groups/?branch=${selectedBranchId}`),
            api.get(`/finance/payment-types/??is_active=true`),
            api.get(
              `/core/students/?is_archived=false&branch=${selectedBranchId}`
            ),
          ]);
        setReceivers(
          receiversRes.data.map((t) => ({ value: t.id, label: t.full_name }))
        );
        setGroups(groupsRes.data.map((g) => ({ value: g.id, label: g.name })));
        setPaymentTypes(
          paymentTypesRes.data.map((p) => ({ value: p.id, label: p.name }))
        );
        setStudents(
          studentsRes.data.map((s) => ({ value: s.id, label: s.full_name }))
        );
        hasFetchedInitialData.current = true;
      } catch (error) {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.[0] ||
          "Filtr ma'lumotlarini yuklashda xatolik.";
        toast.error(errorMsg);
      }
    };
    fetchFilterData();
  }, [selectedBranchId]);

  // Re-fetch payments when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // --- EVENT HANDLERS ---
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      const paramValue =
        value instanceof dayjs ? value.format("YYYY-MM-DD") : value;
      newSearchParams.set(name, paramValue);
    } else {
      newSearchParams.delete(name);
    }
    setSearchParams(newSearchParams, { replace: true });
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

  const handleViewGroup = (payment) => {
    if (payment && payment.group_id) {
      navigate(`/groups/${payment.group_id}`);
    }
  };
  const handleViewStudent = (payment) => {
    if (payment && payment.student_id) {
      navigate(`/students/${payment.student_id}`);
    }
  };
  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (payment) => {
    if (
      window.confirm(
        `${payment.student_name}ning ${payment.amount} so'm to'lovini o'chirishga ishonchingiz komilmi? Bu amalni orqaga qaytarib bo'lmaydi!`
      )
    ) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/finance/transactions/${payment.id}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        fetchPayments();
      } catch (error) {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.[0] ||
          "Xatolik yuz berdi";
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat("fr-FR").format(num || 0) + " so'm";

  const formatPhoneNumber = (n) => {
    const p = n.toString();
    return `+${p.slice(0, 3)} (${p.slice(3, 5)}) ${p.slice(5, 8)}-${p.slice(
      8,
      10
    )}-${p.slice(10, 12)}`;
  };

  // --- DATA TABLE COLUMNS ---
  const columns = [
    { name: "№", selector: (row, i) => i + 1, width: "60px" },
    {
      name: "Sana/vaqt",
      selector: (row) => row.created_at,
      format: (row) => dayjs(row.created_at).format("DD/MM/YYYY HH:mm"),
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "To'lovchi",
      selector: (row) => row.student_name,
      sortable: true,
      minWidth: "180px",
      cell: (row) => (
        <Tooltip
          title={`${row.student_name} - ${formatPhoneNumber(
            row.student_phone_number
          )}`}
        >
          <span
            className="cursor-pointer"
            onClick={() => handleViewStudent(row)}
          >
            {row.student_name}{" "}
          </span>
        </Tooltip>
      ),
    },
    {
      name: "Guruh nomi",
      selector: (row) => row.group_name,
      minWidth: "150px",
      sortable: true,
      cell: (row) => (
        <div
          className="flex items-center space-x-3 py-2 cursor-pointer"
          onClick={() => handleViewGroup(row)}
        >
          <span
            style={{ backgroundColor: row.group_color }}
            className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600"
          ></span>
          <span
            style={{
              color: theme === "dark" ? row.group_text_color : "inherit",
            }}
            className="font-semibold"
          >
            {row.group_name}
          </span>
        </div>
      ),
    },
    {
      name: "Summa",
      selector: (row) => row.amount,
      format: (row) => formatCurrency(row.amount),
      sortable: true,
    },
    {
      name: "To'lov turi",
      selector: (row) => row.payment_type_name,
      sortable: true,
    },
    {
      name: "Qabul qiluvchi",
      selector: (row) => row.receiver_name,
      sortable: true,
      minWidth: "180px",
      cell: (row) => (
        <Tooltip
          title={`${row.receiver_name} - ${formatPhoneNumber(
            row.receiver_phone_number
          )}`}
        >
          {row.receiver_name}
        </Tooltip>
      ),
    },
    {
      name: "Izoh",
      selector: (row) => row.comment,
      sortable: true,
      minWidth: "180px",
      cell: (row) => <Tooltip title={row.comment}>{row.comment}</Tooltip>,
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
    <ThemeProvider theme={muiTheme}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-text-light-primary">
              To'lovlar
            </h1>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
              Jami: {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-200 flex items-center space-x-2">
              <Sheet size={16} /> EXCEL
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} />
              To'lov qo'shish
            </button>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-dark-secondary rounded-lg shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <FormControl size="small" fullWidth>
              <InputLabel>Talaba</InputLabel>
              <MuiSelect
                value={filters.student}
                label="Talaba"
                onChange={(e) => handleFilterChange("student", e.target.value)}
              >
                <MenuItem value="">
                  <em>Barchasi</em>
                </MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Guruh</InputLabel>
              <MuiSelect
                value={filters.group}
                label="Guruh"
                onChange={(e) => handleFilterChange("group", e.target.value)}
              >
                <MenuItem value="">
                  <em>Barchasi</em>
                </MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.value} value={g.value}>
                    {g.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>To'lov turi</InputLabel>
              <MuiSelect
                value={filters.payment_type}
                label="To'lov turi"
                onChange={(e) =>
                  handleFilterChange("payment_type", e.target.value)
                }
              >
                <MenuItem value="">
                  <em>Barchasi</em>
                </MenuItem>
                {paymentTypes.map((pt) => (
                  <MenuItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Qabul qiluvchi</InputLabel>
              <MuiSelect
                value={filters.receiver}
                label="Qabul qiluvchi"
                onChange={(e) => handleFilterChange("receiver", e.target.value)}
              >
                <MenuItem value="">
                  <em>Barchasi</em>
                </MenuItem>
                {receivers.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <DatePicker
              label="Boshlanish"
              value={filters.start_date}
              onChange={(date) => handleFilterChange("start_date", date)}
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="Tugash"
              value={filters.end_date}
              onChange={(date) => handleFilterChange("end_date", date)}
              slotProps={{ textField: { size: "small" } }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-blue-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-tertiary">
          <DataTable
            columns={columns}
            data={payments}
            progressPending={isLoading}
            responsive
            fixedHeader
            fixedHeaderScrollHeight="550px"
            highlightOnHover
            selectableRows
            selectableRowsHighlight
            customStyles={theme === "dark" ? darkThemeStyles : customStyles}
            progressComponent={<ProgressComponent />}
            noDataComponent={<NoDataComponent />}
          />
        </div>

        <ActionPopup
          isOpen={actionPopup.isOpen}
          onClose={closeActionPopup}
          referenceElement={actionPopup.referenceElement}
          title={
            actionPopup.data
              ? `${actionPopup.data.student_name} - ${formatCurrency(
                  actionPopup.data.amount
                )}`
              : "Guruh"
          }
          actions={[
            {
              label: "Batafsil",
              icon: Info,
              onClick: () => {},
            },
            {
              label: "Chek",
              icon: Receipt,
              onClick: () => {},
            },
            {
              label: "Tahrirlash",
              icon: Edit,
              onClick: () => handleEdit(actionPopup.data),
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
      <AddPaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        refreshData={fetchPayments}
      />
      {selectedPayment && isEditModalOpen && (
        <AddPaymentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          refreshData={fetchPayments}
          payment={selectedPayment}
        />
      )}
    </ThemeProvider>
  );
};

export default PaymentsPage;
