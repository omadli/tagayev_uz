import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Plus } from "lucide-react";
import Select from "react-select";
import Portal from "../ui/Portal";
import clsx from "clsx";

// Import all our custom UI components
import DateInput from "../ui/DateInput";
import ColorInput from "../ui/ColorInput";
import TimeInput from "../ui/TimeInput";
import Input from "../ui/Input";
import NumberInput from "../ui/NumberInput";

// --- DEFINITIVE VALIDATION SCHEMA ---
const schema = yup.object().shape({
  name: yup.string().required("Guruh nomi majburiy"),
  price: yup
    .number()
    .min(0)
    .required("Narx kiritilishi shart")
    .typeError("Faqat raqam kiriting"),
  teacher: yup.object().required("O'qituvchi tanlanishi shart").nullable(),
  room: yup.object().required("Xona tanlanishi shart").nullable(), // Now required
  start_date: yup.date().required("Boshlanish sanasi majburiy"),
  end_date: yup
    .date()
    .required("Tugash sanasi majburiy")
    .min(yup.ref("start_date"), "Tugash sanasi keyinroq bo'lishi kerak"),
  course_start_time: yup.string().required("Boshlanish vaqti majburiy"),
  course_end_time: yup.string().required("Tugash vaqti majburiy"),
  // Validation for our new weekday logic
  weekday_type: yup.object().required(),
  custom_weekdays: yup.array().when("weekday_type", {
    is: (val) => val?.value === "custom",
    then: (schema) => schema.min(1, "Kamida bitta hafta kuni tanlanishi kerak"),
    otherwise: (schema) => schema.optional(),
  }),
  color: yup.string().required(),
  text_color: yup.string().required(),
  comment: yup.string(),
});

// Options for the new weekday selector
const weekdayTypeOptions = [
  { value: "135", label: "Toq kunlar" },
  { value: "246", label: "Juft kunlar" },
  { value: "1234567", label: "Har kuni" },
  { value: "custom", label: "Boshqa..." },
];
const customWeekdayOptions = [
  { value: "1", label: "Dushanba" },
  { value: "2", label: "Seshanba" },
  { value: "3", label: "Chorshanba" },
  { value: "4", label: "Payshanba" },
  { value: "5", label: "Juma" },
  { value: "6", label: "Shanba" },
  { value: "7", label: "Yakshanba" },
];

const AddGroupModal = ({
  isOpen,
  onClose,
  refreshGroups,
  selectedBranchId,
}) => {
  // State for dropdown options
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      start_date: new Date(),
      end_date: null,
      color: "#3B82F6",
      text_color: "#FFFFFF",
      weekday_type: weekdayTypeOptions[0], // Default to 'Toq kunlar'
      custom_weekdays: [],
      course_start_time: "", // No default time
      course_end_time: "",
    },
  });

  // Watch the value of the main weekday selector
  const selectedWeekdayType = watch("weekday_type");

  // Fetch data for dropdowns when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchFilterData = async () => {
        try {
          const [teachersRes, roomsRes] = await Promise.all([
            api.get("/users/teachers/?is_archived=false"),
            api.get(`/core/rooms/?branch=${selectedBranchId}`), // Fetch rooms for the selected branch
          ]);
          setTeachers(
            teachersRes.data.map((t) => ({ value: t.id, label: t.full_name }))
          );
          setRooms(roomsRes.data.map((r) => ({ value: r.id, label: r.name })));
        } catch (error) {
          toast.error("Ma'lumotlarni yuklashda xatolik.");
        }
      };
      fetchFilterData();
    }
  }, [isOpen, selectedBranchId]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    // --- WEEKDAY LOGIC ---
    // Determine the final weekday string based on user's selection
    let finalWeekdays;
    if (data.weekday_type.value === "custom") {
      finalWeekdays = data.custom_weekdays.map((day) => day.value).join("");
    } else {
      finalWeekdays = data.weekday_type.value;
    }

    const payload = {
      name: data.name,
      price: data.price,
      branch: selectedBranchId,
      teacher: data.teacher.value,
      room: data.room.value,
      start_date: data.start_date.toISOString().split("T")[0],
      end_date: data.end_date.toISOString().split("T")[0],
      course_start_time: data.course_start_time,
      course_end_time: data.course_end_time,
      color: data.color,
      text_color: data.text_color,
      comment: data.comment,
      weekdays: finalWeekdays,
    };

    const toastId = toast.loading("Guruh qo'shilmoqda...");
    try {
      await api.post("/core/groups/", payload);
      toast.success("Muvaffaqiyatli qo'shildi", { id: toastId });
      refreshGroups();
      handleClose();
    } catch (error) {
      // DRF validation errors often come as a dictionary
      const errorData = error.response?.data;
      const errorMsg =
        typeof errorData === "object"
          ? Object.values(errorData).flat().join(" ")
          : "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };

  if (!isOpen) return null;

  // Custom styles for react-select to handle z-index
  const selectStyles = {
    menu: (base) => ({ ...base, zIndex: 55 }),
    menuPortal: (base) => ({ ...base, zIndex: 55 }),
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">Yangi Guruh Qo'shish</h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-5 overflow-y-auto"
          >
            <Input
              id="name"
              label="Guruh nomi"
              {...register("name")}
              error={errors.name}
            />

            {/* --- PRICE INPUT FIX --- */}
            <NumberInput
              name="price"
              label="1 oylik kurs narxi"
              suffix=" so'm"
              control={control}
              error={errors.price}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 px-2">
                  O'qituvchi
                </label>
                <Controller
                  name="teacher"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={teachers}
                      placeholder="Tanlang..."
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
                {errors.teacher && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.teacher.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 px-2">
                  Xona
                </label>
                <Controller
                  name="room"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={rooms}
                      placeholder="Tanlang..."
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
                {errors.room && <p>{errors.room.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                name="start_date"
                label="Boshlanish sanasi"
                control={control}
                error={errors.start_date}
              />
              <DateInput
                name="end_date"
                label="Tugash sanasi"
                control={control}
                error={errors.end_date}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* --- THIS IS THE FIX --- */}
              <TimeInput
                name="course_start_time"
                label="Boshlanish vaqti"
                control={control}
                error={errors.course_start_time}
              />
              <TimeInput
                name="course_end_time"
                label="Tugash vaqti"
                control={control}
                error={errors.course_end_time}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 px-2">
                Hafta kunlari
              </label>
              <Controller
                name="weekday_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={weekdayTypeOptions}
                    // Add these two props to fix the z-index
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                  />
                )}
              />
            </div>

            {selectedWeekdayType?.value === "custom" && (
              <div className="pl-4 border-l-2">
                <label className="text-xs font-medium text-gray-500 px-2">
                  O'zingiz tanlang
                </label>
                <Controller
                  name="custom_weekdays"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isMulti
                      options={customWeekdayOptions}
                      // Add these two props here as well
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
                {errors.custom_weekdays && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.custom_weekdays.message}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* --- THIS IS THE FIX --- */}
              <ColorInput
                name="color"
                label="Fon rangi"
                control={control}
                error={errors.color}
              />
              <ColorInput
                name="text_color"
                label="Matn rangi"
                control={control}
                error={errors.text_color}
              />
            </div>

            <Input
              id="comment"
              label="Izoh (ixtiyoriy)"
              {...register("comment")}
              error={errors.comment}
            />

            <div className="flex justify-end pt-4 gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700"
              >
                GURUH QO'SHISH
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddGroupModal;
