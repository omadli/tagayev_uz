import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../ui/Portal";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext"; // For dark mode
import dayjs from "dayjs";
import clsx from "clsx";
import NumberInput from "../ui/NumberInput";
import SelectStandard from "react-select";
// MUI Imports
import {
  TextField,
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { getMuiTheme } from "../../theme/muiTheme"; // Import our new theme

// Reusable AsyncSelect for Students
import AsyncSelect from "react-select/async";

const uzbekMonths = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const getCurrentMonthUzbek = () => {
  const monthIndex = new Date().getMonth(); // 0-based
  return uzbekMonths[monthIndex];
};

// --- UPDATED VALIDATION SCHEMA ---
const schema = yup.object().shape({
  student: yup.object().required("O'quvchi tanlanishi shart").nullable(),
  student_group: yup.object().required("Guruh tanlanishi shart").nullable(),
  amount: yup
    .number()
    .positive("Summa 0 dan katta bo'lishi kerak")
    .required("To'lov miqdori majburiy")
    .typeError("Summa majburiy"),
  payment_type_id: yup.mixed().required("To'lov turi majburiy"), // Now a simple string/number ID,
  receiver_id: yup.string().required("Qabul qiluvchi majburiy"),
  comment: yup.string().required("Izoh kiritilishi shart"),
  // --- VALIDATION FOR DATE & TIME ---
  created_at: yup
    .mixed()
    .required("To'lov vaqti majburiy")
    .test(
      "is-not-future",
      "Kelajak sanasiga to'lov kiritib bo'lmaydi",
      (value) => {
        return dayjs(value).isBefore(dayjs().add(1, "minute")); // Allow 1 min buffer
      }
    ),
});

const defaultValues = {
  student: "",
  group: "",
  amount: "",
  payment_type: "",
  receiver: "",
  comment: "",
};

function cleanNumber(value) {
  if (value == null || value === "") return 0;
  const num = parseFloat(value);
  return Number.isInteger(num) ? parseInt(num, 10) : num;
}

const AddPaymentModal = ({
  isOpen,
  onClose,
  initialStudent = null,
  initialGroup = null,
  refreshData = null,
  payment = null,
}) => {
  const isEditMode = Boolean(payment);
  const { user: currentUser } = useAuth();
  const { theme, selectedBranchId } = useSettings(); // Get current theme
  const muiTheme = getMuiTheme(theme); // Create the appropriate MUI theme
  const [enrollments, setEnrollments] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [balance, setBalance] = useState({
    current: 0,
    after: 0,
    upcoming: { date: null, amount: 0 },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      created_at: dayjs(),
      comment: `${getCurrentMonthUzbek()} oyi uchun to'lov`, // Default to now
      student: initialStudent,
    },
  });

  const selectedStudent = watch("student");
  const selectedGroup = watch("student_group");
  const paymentAmount = watch("amount");

  useEffect(() => {
    if (payment) {
      reset({
        student: payment.student_id || "",
        group: payment.group_id || "",
        amount: payment.amount || "",
        payment_type: payment.payment_type_id || "",
        receiver: payment.receiver_id || "",
        comment: payment.comment || "",
      });
    } else {
      reset(defaultValues);
    }
  }, [payment, reset]);

  // Function to load student options from API
  const loadStudentOptions = (query, callback) => {
    api
      .get(
        `/core/students/?is_archived=false&group_status=active&branch=${selectedBranchId}&search=${query}`
      )
      .then((res) => {
        const options = (res.data.results || res.data).map((s) => ({
          value: s.id,
          label: `${s.full_name} (+${s.phone_number})`,
        }));
        callback(options);
      });
  };

  // 🔹 Load dropdown data once per modal open
  useEffect(() => {
    if (!isOpen) return;

    // Payment Types
    api.get("/finance/payment-types/?is_active=true").then((res) => {
      const opts = res.data.map((pt) => ({ value: pt.id, label: pt.name }));
      setPaymentTypes(opts);

      if (!isEditMode && opts.length > 0) {
        setValue("payment_type_id", opts[0].value);
      }
    });

    // Receivers
    api.get("/users/users/?is_archived=false").then((res) => {
      const users = (res.data.results || res.data).filter(
        (u) => u.is_teacher || u.is_admin || u.is_ceo
      );
      const sorted = users.sort((a, b) => {
        if (a.id === currentUser.user_id) return -1;
        if (b.id === currentUser.user_id) return 1;
        if (a.is_ceo && !b.is_ceo) return -1;
        if (b.is_ceo && !a.is_ceo) return 1;
        return a.full_name.localeCompare(b.full_name);
      });
      const opts = sorted.map((u) => ({
        value: u.id,
        label: `${u.full_name} +${u.phone_number}`,
      }));
      setReceivers(opts);

      if (!isEditMode) {
        const me = opts.find((r) => r.value === currentUser.user_id);
        if (me) setValue("receiver_id", me.value);
      }
    });
  }, [isOpen, isEditMode, currentUser, setValue]);

  // 🔹 Prefill form when switching add/edit
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && payment) {
      reset({
        student: { value: payment.student_id, label: payment.student_name },
        student_group: payment.student_group_id,
        amount: cleanNumber(payment.amount),
        created_at: dayjs(payment.created_at),
        payment_type_id: payment.payment_type_id,
        receiver_id: payment.receiver_id,
        comment: payment.comment,
      });
    } else {
      reset({
        created_at: dayjs(),
        comment: `${getCurrentMonthUzbek()} oyi uchun to'lov`,
        student: initialStudent,
        student_group: initialGroup ?? null,
        payment_type_id: paymentTypes[0]?.value || "",
        receiver_id:
          receivers.find((r) => r.value === currentUser.user_id)?.value ?? "",
        amount: "",
      });
    }
  }, [isOpen, isEditMode, payment, reset]); // 👈 no paymentTypes/receivers here

  // 🔹 When student changes → load enrollments
  useEffect(() => {
    if (!selectedStudent?.value) {
      setEnrollments([]);
      if (!isEditMode) setValue("student_group", null);
      return;
    }

    api
      .get(`/core/student-enrollments/?student_id=${selectedStudent.value}`)
      .then((res) => {
        const opts = res.data.map((en) => ({
          value: en.id,
          label: `${en.group_name} (${en.teacher_name})`,
          balance: cleanNumber(en.balance),
          price: cleanNumber(en.effective_price),
          next_due_date: en.next_due_date,
          next_due_amount: cleanNumber(en.next_due_amount),
        }));
        setEnrollments(opts);

        if (!isEditMode && opts.length === 1) {
          setValue("student_group", opts[0], { shouldValidate: true });
          setValue("amount", opts[0].price, { shouldValidate: true });
        }
        if (payment && opts.length > 0) {
          setValue(
            "student_group",
            opts.find((e) => e.value === payment.student_group_id)
          );
        }
      });
  }, [selectedStudent, isEditMode, payment, setValue]);

  // 🔹 Balance calculation
  useEffect(() => {
    if (!selectedGroup) {
      setBalance({ current: 0, after: 0, upcoming: { date: null, amount: 0 } });
      return;
    }
    if (!isEditMode) {
      setValue("amount", cleanNumber(selectedGroup.price));
    }

    const current = cleanNumber(selectedGroup.balance);
    const amount = cleanNumber(paymentAmount);

    let after = current + amount;
    if (isEditMode && payment) {
      after = current - cleanNumber(payment.amount) + amount;
    }

    setBalance({
      current,
      after,
      upcoming: {
        date: selectedGroup.next_due_date,
        amount: cleanNumber(selectedGroup.next_due_amount),
      },
    });
  }, [selectedGroup, paymentAmount, isEditMode, payment, setValue]);

  const handleClose = () => {
    setBalance({ current: 0, after: 0 });
    onClose();
    reset();
  };

  const onSubmit = async (data) => {
    const payload = {
      student_group: data.student_group.value,
      amount: data.amount,
      payment_type: data.payment_type_id,
      receiver: data.receiver_id,
      comment: data.comment || "",
      created_at: data.created_at.toISOString(),
    };

    const toastId = toast.loading(
      isEditMode ? "To'lov yangilanmoqda..." : "To'lov qo'shilmoqda..."
    );
    try {
      if (isEditMode) {
        await api.patch(`/finance/transactions/${payment.id}/`, payload);
        toast.success("Muvaffaqiyatli yangilandi", { id: toastId });
      } else {
        await api.post("/finance/transactions/", payload);
        toast.success("To'lov muvaffaqiyatli qo'shildi", { id: toastId });
      }
      handleClose();
      if (refreshData) refreshData();
      else window.location.reload();
    } catch (err) {
      const errorData = err.response?.data;
      const msg =
        typeof errorData === "object"
          ? Object.values(errorData).flat().join(" ")
          : "Xatolik yuz berdi";
      toast.error(msg, { id: toastId });
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (num) =>
    new Intl.NumberFormat("fr-FR").format(num || 0) + " so'm";
  const formatDate = (dateStr) =>
    dateStr ? dayjs(dateStr).format("DD/MM/YYYY") : "Mavjud emas";

  const reactSelectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === "dark" ? "" : "white",
      borderColor: theme === "dark" ? "" : "#D1D5DB",
      color: theme === "dark" ? "white" : "black",
    }),
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <ThemeProvider theme={muiTheme}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">Yangi To'lov Qo'shish</h2>
              <button onClick={handleClose}>
                <X />
              </button>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-5 overflow-y-auto"
            >
              <div>
                <Controller
                  name="student"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      {/* <InputLabel>O'quvchi</InputLabel> */}
                      <AsyncSelect
                        {...field}
                        cacheOptions
                        defaultOptions
                        loadOptions={loadStudentOptions}
                        placeholder="O'quvchini qidirish..."
                        isDisabled={!!initialStudent}
                        menuPortalTarget={document.body}
                        styles={reactSelectStyles}
                      />
                    </FormControl>
                  )}
                />
                {errors.student && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.student.message}
                  </p>
                )}
              </div>
              <div>
                <Controller
                  name="student_group"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <SelectStandard
                        {...field}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        options={enrollments}
                        placeholder="Guruhni tanlang"
                        isDisabled={!selectedStudent || !!initialGroup}
                        menuPortalTarget={document.body}
                        styles={reactSelectStyles}
                      />
                    </FormControl>
                  )}
                />
                {errors.student_group && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.student_group.message}
                  </p>
                )}
              </div>

              <NumberInput
                name="amount"
                label="To'lov miqdori"
                control={control}
                suffix=" so'm"
                error={errors.amount}
              />

              {/* --- NEW BALANCE & UPCOMING PAYMENT INFO BLOCK --- */}
              {selectedGroup && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Hozirgi balans:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(balance.current)}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>To'lovdan keyin:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(balance.after)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t dark:border-gray-600 pt-2 mt-2">
                    <span>Yaqinlashayotgan to'lov:</span>
                    <span className="font-bold text-orange-500">
                      {balance.upcoming?.date
                        ? `${formatCurrency(
                            balance.upcoming.amount
                          )} (${formatDate(balance.upcoming.date)})`
                        : "Mavjud emas"}
                    </span>
                  </div>
                </div>
              )}

              {/* comment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Controller
                  name="created_at"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      {...field}
                      label="To'lov vaqti"
                      value={field.value ? dayjs(field.value) : null}
                      ampm={false}
                      format="DD/MM/YYYY HH:mm" // 24-hour format
                      slotProps={{
                        textField: {
                          error: !!errors.created_at,
                          helperText: errors.created_at?.message,
                        },
                      }}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.created_at && <p>{errors.created_at.message}</p>}

                <div>
                  <Controller
                    name="payment_type_id"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.payment_type_id}>
                        <InputLabel>To'lov turi</InputLabel>
                        <MuiSelect
                          {...field}
                          value={
                            field.value !== undefined && field.value !== null
                              ? field.value
                              : paymentTypes.length > 0
                              ? paymentTypes[0].value
                              : ""
                          }
                          label="To'lov turi"
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          {paymentTypes.map((pt) => (
                            <MenuItem key={pt.value} value={pt.value}>
                              {pt.label}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl>
                    )}
                  />
                  {errors.payment_type_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.payment_type_id.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Controller
                  name="receiver_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      disabled={!currentUser.roles.includes("CEO")}
                    >
                      <InputLabel>Qabul qiluvchi</InputLabel>
                      <MuiSelect
                        {...field}
                        value={
                          field.value !== undefined && field.value !== null
                            ? field.value
                            : receivers.length > 0
                            ? receivers[0].value
                            : ""
                        }
                        label="Qabul qiluvchi"
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {receivers.map((r) => (
                          <MenuItem key={r.value} value={r.value}>
                            {r.label}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  )}
                />
                {errors.receiver && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.receiver.message}
                  </p>
                )}
              </div>

              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Izoh" fullWidth />
                )}
              />

              <div className="flex justify-end pt-4 gap-3 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 border rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
                >
                  {isEditMode ? "O'ZGARISHLARNI SAQLASH" : "TO'LOVNI QO'SHISH"}
                </button>
              </div>
            </form>
          </div>
        </ThemeProvider>
      </div>
    </Portal>
  );
};

export default AddPaymentModal;
