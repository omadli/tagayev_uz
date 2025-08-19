import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useSettings } from "../../../context/SettingsContext";
import { getMuiTheme } from "../../../theme/muiTheme";
import { ThemeProvider } from "@mui/material/styles";
import {
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Select as MuiSelect,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Trash2,
  Printer,
  Info,
  MoreVertical,
  Calendar as CalendarIcon,
  Check,
  X,
} from "lucide-react";
import Select from "react-select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import clsx from "clsx";
import ActionPopup from "../../ui/ActionPopup";
import NumberInput from "../../ui/NumberInput";
import Input from "../../ui/Input";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Validation schema for the inline edit form
const editSchema = yup.object().shape({
  created_at: yup.mixed().required("Sana majburiy"),
  amount: yup
    .number()
    .min(0, "0 yoki musbat son bo'lishi kerak")
    .required("Summa majburiy"),
  comment: yup.string(),
  student_group_id: yup.mixed().nullable(),
});

const StudentPaymentsTab = ({ studentId }) => {
  const { theme } = useSettings();
  const muiTheme = getMuiTheme(theme);

  // --- STATE MANAGEMENT ---
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // Tracks which transaction is being edited inline

  const [enrollmentOptions, setEnrollmentOptions] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // State for filters and ordering
  const [filters, setFilters] = useState({
    group: null,
    // Default date range: from the earliest join date to today
    dateRange: [dayjs().subtract(1, "month"), dayjs()],
  });
  const [ordering, setOrdering] = useState("-created_at"); // '-created_at' = newest first
  const [actionPopup, setActionPopup] = useState({
    isOpen: false,
    data: null,
    referenceElement: null,
  });

  // --- DATA FETCHING ---
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        student: studentId,
        group: filters.group?.value || undefined,
        start_date: filters.dateRange[0]?.format("YYYY-MM-DD"),
        end_date: filters.dateRange[1]?.format("YYYY-MM-DD"),
        ordering: ordering,
      };
      const response = await api.get("/finance/transactions/", { params });
      setTransactions(response.data.results || response.data);
    } catch {
      toast.error("To'lovlarni yuklab bo'lmadi.");
    } finally {
      setIsLoading(false);
    }
  }, [studentId, filters, ordering]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setIsLoadingFilters(true);
    api
      .get(`/core/student-enrollments/?student_id=${studentId}`)
      .then((res) => {
        const options = res.data.map((en) => ({
          value: en.id,
          label: en.group_name,
        }));
        setEnrollmentOptions(options);

        // Set the default date range based on the earliest join date
        if (res.data.length > 0) {
          const earliestJoinDate = res.data.reduce(
            (earliest, en) =>
              new Date(en.joined_at) < new Date(earliest)
                ? en.joined_at
                : earliest,
            res.data[0].joined_at
          );
          setFilters((prev) => ({
            ...prev,
            dateRange: [dayjs(earliestJoinDate), dayjs()],
          }));
        }
      })
      .catch(() => toast.error("Guruh ma'lumotlarini yuklab bo'lmadi."))
      .finally(() => setIsLoadingFilters(false));
  }, [studentId]);

  // --- CALCULATIONS (TOTALS) ---
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.transaction_type === "DEBIT") acc.debit += parseFloat(t.amount);
        if (t.transaction_type === "CREDIT") acc.credit += parseFloat(t.amount);
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  }, [transactions]);
  const finalBalance = totals.credit - totals.debit;

  const openActionPopup = (e, transaction) => {
    e.stopPropagation();
    setActionPopup({
      isOpen: true,
      data: transaction,
      referenceElement: e.currentTarget,
    });
  };
  const closeActionPopup = () =>
    setActionPopup({ isOpen: false, data: null, referenceElement: null });

  // --- RENDER LOGIC & COMPONENTS ---
  const formatCurrency = (num) =>
    new Intl.NumberFormat("fr-FR").format(num || 0);
  const handleDelete = async (transaction) => {
    const toastId = toast.loading("O'chirilmoqda...");
    try {
      await api.delete(`/finance/transactions/${transaction.id}/`);
      toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
      fetchTransactions(); // Re-fetch data to show changes
    } catch {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };
  const EditRow = ({ transaction, onCancel }) => {
    const {
      register,
      control,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors, isSubmitting },
    } = useForm({
      resolver: yupResolver(editSchema),
      defaultValues: {
        created_at: dayjs(transaction.created_at),
        amount: parseFloat(transaction.amount),
        comment: transaction.comment || "",
        student_group_id: transaction.student_group_id || null,
      },
    });

    const onSave = async (data) => {
      const payload = {
        amount: data.amount,
        comment: data.comment,
        created_at: data.created_at.toISOString(),
        student_group_id: data.student_group_id,
      };
      const toastId = toast.loading("Saqlanmoqda...");
      try {
        await api.patch(`/finance/transactions/${transaction.id}/`, payload);
        toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
        fetchTransactions();
        setEditingId(null);
      } catch (err) {
        const errorData = err.response?.data;
        const msg =
          typeof errorData === "object"
            ? Object.values(errorData).flat().join(" ")
            : "Xatolik yuz berdi";
        toast.error(msg, { id: toastId });
      }
    };

    return (
      <TableRow sx={{ "& > *": { padding: "8px 16px" } }}>
        <TableCell>
          <Controller
            name="created_at"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                {...field}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    variant: "standard",
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            name="student_group_id"
            control={control}
            render={({ field }) => (
              <FormControl variant="standard" size="medium" fullWidth>
                <MuiSelect
                  {...field}
                  value={
                    field.value !== undefined && field.value !== null
                      ? field.value
                      : transaction.student_group_id
                      ? transaction.student_group_id
                      : ""
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {enrollmentOptions.map((en) => (
                    <MenuItem key={en.value} value={en.value}>
                      {en.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            )}
          />
        </TableCell>
        <TableCell colSpan={2}>
          <NumberInput
            name="amount"
            control={control}
            suffix=" so'm"
            error={errors.amount}
            variant="standard"
          />
        </TableCell>
        <TableCell>
          <Controller
            name="comment"
            control={control}
            render={({ field }) => <Input variant="standard" {...field} />}
          />
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Saqlash">
            <IconButton
              onClick={handleSubmit(onSave)}
              color="success"
              size="medium"
            >
              <Check />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bekor qilish">
            <IconButton onClick={onCancel} color="error" size="medium">
              <X />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="space-y-6">
        {/* --- FILTER BAR --- */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
          <Select
            options={enrollmentOptions}
            onChange={(opt) => setFilters({ ...filters, group: opt })}
            isClearable
            isLoading={isLoadingFilters}
            placeholder="Guruh bo'yicha filtr"
            className="flex-1 min-w-[200px]"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          <DatePicker
            label="Boshlanish sanasi"
            value={filters.startDate}
            onChange={(date) =>
              setFilters((prev) => ({ ...prev, startDate: date }))
            }
            slotProps={{ textField: { size: "small" } }}
            format="DD/MM/YYYY"
          />
          <DatePicker
            label="Tugash sanasi"
            value={filters.endDate}
            onChange={(date) =>
              setFilters((prev) => ({ ...prev, endDate: date }))
            }
            slotProps={{ textField: { size: "small" } }}
            format="DD/MM/YYYY"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              setOrdering((prev) =>
                prev.startsWith("-") ? "created_at" : "-created_at"
              )
            }
            startIcon={
              ordering.startsWith("-") ? (
                <ArrowUp size={16} />
              ) : (
                <ArrowDown size={16} />
              )
            }
          >
            {ordering.startsWith("-") ? "Avval yangilari" : "Avval eskilari"}
          </Button>
        </div>
        {/* --- TRANSACTIONS TABLE --- */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ maxHeight: 400 }}
          className="!bg-white dark:!bg-dark-secondary !rounded-lg border dark:!border-dark-tertiary"
        >
          <Table stickyHeader aria-label="sticky table" size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ minWidth: 80 }}>Sana/Vaqt</TableCell>
                <TableCell style={{ minWidth: 120 }}>Guruh</TableCell>
                <TableCell style={{ minWidth: 80 }} align="right">
                  <Tooltip title="Debet">
                    <span>Hisoblangan</span>
                  </Tooltip>
                </TableCell>
                <TableCell style={{ minWidth: 80 }} align="right">
                  <Tooltip title="Kredit">
                    <span>To'langan</span>
                  </Tooltip>
                </TableCell>
                <TableCell style={{ minWidth: 200, textAlign: "center" }}>
                  Izoh
                </TableCell>
                <TableCell style={{ minWidth: 80, textAlign: "center" }}>
                  Harakatlar
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) =>
                  editingId === t.id ? (
                    <EditRow
                      key={t.id}
                      transaction={t}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        {dayjs(t.created_at).format("DD/MM/YYYY HH:mm")}
                      </TableCell>
                      <TableCell>{t.group_name}</TableCell>
                      <TableCell
                        align="right"
                        className="font-mono text-red-500"
                      >
                        {t.transaction_type === "DEBIT"
                          ? `${formatCurrency(t.amount)} so'm`
                          : "-"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="font-mono text-green-500"
                      >
                        {t.transaction_type === "CREDIT"
                          ? `${formatCurrency(t.amount)} so'm`
                          : "-"}
                      </TableCell>
                      <TableCell>{t.comment}</TableCell>
                      <TableCell align="right">
                        <div className="hidden md:flex items-center justify-end">
                          <Tooltip title="Chek">
                            <IconButton color="success" size="small">
                              <Printer />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Batafsil">
                            <IconButton color="info" size="small">
                              <Info />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tahrirlash">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => setEditingId(t.id)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title="O'chirish"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(t);
                            }}
                          >
                            <IconButton size="small" color="error">
                              <Trash2 />
                            </IconButton>
                          </Tooltip>
                        </div>
                        <div className="md:hidden">
                          <IconButton onClick={(e) => openActionPopup(e, t)}>
                            <MoreVertical />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- TOTALS & SUMMARY FOOTER --- */}
        <div className="p-4 bg-gray-50 dark:bg-dark-tertiary rounded-lg space-y-1 text-right">
          <div className="flex justify-between font-bold">
            <span className="text-gray-600 dark:text-text-light-secondary">
              Jami hisoblangan:
            </span>
            <span className="text-red-500">
              {formatCurrency(totals.debit)} so'm
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-gray-600 dark:text-text-light-secondary">
              Jami to'langan:
            </span>
            <span className="text-green-500">
              {formatCurrency(totals.credit)} so'm
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-dark-accent">
            <span className="text-gray-800 dark:text-text-light-primary">
              Yakuniy hisob:
            </span>
            <span
              className={clsx(
                finalBalance < 0 ? "text-red-500" : "text-blue-500"
              )}
            >
              {formatCurrency(Math.abs(finalBalance))}{" "}
              {finalBalance < 0
                ? "so'm qarzdor"
                : finalBalance == 0
                ? ""
                : "so'm ortiqcha to'lov"}
            </span>
          </div>
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Button variant="contained">O'quvchi to'lovini qo'shish</Button>
          <Button variant="outlined">Qo'shimcha hisoblash</Button>
          <Button variant="outlined">Pul qaytarish</Button>
          <Button variant="outlined">Bonus berish</Button>
        </div>
      </div>

      <ActionPopup
        isOpen={actionPopup.isOpen}
        onClose={closeActionPopup}
        referenceElement={actionPopup.referenceElement}
        title="Harakatlar"
        actions={[
          {
            label: "Chek",
            icon: Printer,
            onClick: () => {},
            className: "text-green-500",
          },
          {
            label: "Batafsil",
            icon: Info,
            onClick: () => {},
            className: "text-blue-500",
          },
          {
            label: "Tahrirlash",
            icon: Edit,
            onClick: () => {
              setEditingId(actionPopup.referenceElement.id);
            },
            className: "text-orange-500",
          },
          {
            label: "O'chirish",
            icon: Trash2,
            onClick: (e) => {
              e.preventDefault();
              handleDelete(actionPopup.referenceElement.id);
            },
            className: "text-red-500",
          },
        ]}
      />
    </ThemeProvider>
  );
};

export default StudentPaymentsTab;
