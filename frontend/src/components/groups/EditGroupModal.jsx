import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Select from "react-select";
import Portal from "../ui/Portal";

import DateInput from "../ui/DateInput";
import ColorInput from "../ui/ColorInput";
import TimeInput from "../ui/TimeInput";
import Input from "../ui/Input";

// --- Weekday Options ---
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

// --- Validation Schema ---
const schema = yup.object().shape({
  name: yup.string().required("Guruh nomi majburiy"),
  teacher: yup.object().required("O'qituvchi tanlanishi shart").nullable(),
  room: yup.object().required("Xona tanlanishi shart").nullable(),
  start_date: yup.date().required("Boshlanish sanasi majburiy"),
  end_date: yup
    .date()
    .required("Tugash sanasi majburiy")
    .min(yup.ref("start_date"), "Tugash sanasi keyinroq bo'lishi kerak"),
  course_start_time: yup.string().required("Boshlanish vaqti majburiy"),
  course_end_time: yup.string().required("Tugash vaqti majburiy"),
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

const EditGroupModal = ({
  isOpen,
  onClose,
  refreshGroups,
  group,
  selectedBranchId,
}) => {
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
  });

  const selectedWeekdayType = watch("weekday_type");

  useEffect(() => {
    if (isOpen && group) {
      const fetchData = async () => {
        try {
          const [teachersRes, roomsRes] = await Promise.all([
            api.get("/users/teachers/?is_archived=false"),
            api.get(`/core/rooms/?branch=${selectedBranchId}`),
          ]);

          const teacherOptions = teachersRes.data.map((t) => ({
            value: t.id,
            label: t.full_name,
          }));
          const roomOptions = roomsRes.data.map((r) => ({
            value: r.id,
            label: r.name,
          }));

          setTeachers(teacherOptions);
          setRooms(roomOptions);

          const weekdays = group.weekdays
            .split("")
            .map((day) =>
              customWeekdayOptions.find((opt) => opt.value === day)
            );

          reset({
            name: group.name,
            teacher:
              teacherOptions.find((t) => t.label === group.teacher_name) ||
              null,
            room: roomOptions.find((r) => r.label === group.room_name) || null,
            start_date: new Date(group.start_date),
            end_date: new Date(group.end_date),
            course_start_time: group.course_start_time.slice(0, 5),
            course_end_time: group.course_end_time.slice(0, 5),
            weekday_type:
              weekdayTypeOptions.find((opt) => opt.value === group.weekdays) ||
              weekdayTypeOptions[3],
            custom_weekdays: weekdays,
            color: group.color,
            text_color: group.text_color,
            comment: group.comment || "",
          });
        } catch {
          toast.error("Ma'lumotlarni yuklashda xatolik.");
        }
      };

      fetchData();
    }
  }, [isOpen, group, selectedBranchId, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    const finalWeekdays =
      data.weekday_type.value === "custom"
        ? data.custom_weekdays.map((d) => d.value).join("")
        : data.weekday_type.value;

    const payload = {
      name: data.name,
      teacher: data.teacher.value,
      room: data.room.value,
      start_date: data.start_date.toISOString().split("T")[0],
      end_date: data.end_date.toISOString().split("T")[0],
      course_start_time: data.course_start_time,
      course_end_time: data.course_end_time,
      weekdays: finalWeekdays,
      color: data.color,
      text_color: data.text_color,
      comment: data.comment,
    };

    const toastId = toast.loading("O'zgarishlar saqlanmoqda...");
    try {
      await api.patch(`/core/groups/${group.id}/`, payload);
      toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
      refreshGroups();
      handleClose();
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

  const selectStyles = {
    menu: (base) => ({ ...base, zIndex: 55 }),
    menuPortal: (base) => ({ ...base, zIndex: 55 }),
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">Guruhni Tahrirlash</h2>
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
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
                {errors.room && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.room.message}
                  </p>
                )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                O'zgarishlarni Saqlash
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditGroupModal;
