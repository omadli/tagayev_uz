import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Camera, Eye, EyeOff } from "lucide-react";

// Import our custom UI components
import Input from "../ui/Input";
import PhoneNumberInput from "../ui/PhoneNumberInput";
import DateInput from "../ui/DateInput";
import NumberInput from "../ui/NumberInput";
import Portal from "../ui/Portal";

// --- UPDATED VALIDATION SCHEMA ---
// We now make salary and percentage optional and add a test for mutual exclusivity.
const schema = yup
  .object()
  .shape({
    full_name: yup.string().required("Ism-familiya kiritilishi shart"),
    phone_number: yup
      .string()
      .transform((v) => v.replace(/[^\d]/g, ""))
      .length(9)
      .required("Telefon raqam majburiy"),
    password: yup.string().min(6).required("Parol kiritish majburiy"),
    enrollment_date: yup.date().required("Sana kiritilishi shart"),
    salary: yup
      .number()
      .transform((v) => (isNaN(v) ? undefined : v))
      .nullable(),
    percentage: yup
      .number()
      .transform((v) => (isNaN(v) ? undefined : v))
      .nullable(),
    profile_photo: yup.mixed().optional(),
  })
  .test(
    "salary-or-percentage",
    "Faqat Oylik yoki Foizdan bittasini kiriting", // Error message
    (value) => {
      // Return true (valid) if one OR neither is filled, but not both.
      return !(value.salary && value.percentage);
    }
  );

const AddTeacherModal = ({ isOpen, onClose, refreshTeachers }) => {
  // State for UI elements
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const photoInputRef = useRef(null);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      enrollment_date: new Date(),
      percentage: 70,
    },
  });

  // --- SMART INPUT LOGIC ---
  // Watch for changes in the salary and percentage fields
  const salaryValue = watch("salary");
  const percentageValue = watch("percentage");

  useEffect(() => {
    // If the user types in the salary field, clear the percentage field
    if (salaryValue) {
      setValue("percentage", "", { shouldValidate: true });
    }
  }, [salaryValue, setValue]);

  useEffect(() => {
    // If the user types in the percentage field, clear the salary field
    if (percentageValue) {
      setValue("salary", "", { shouldValidate: true });
    }
  }, [percentageValue, setValue]);

  // Handler for when a user selects a profile photo file
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    reset();
    setPhotoPreview(null);
    onClose();
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    const phone = `998${data.phone_number.replace(/[^\d]/g, "")}`;

    // --- SUBMISSION LOGIC FIX ---
    // If neither was entered, default percentage to 70
    if (!data.salary && !data.percentage) {
      formData.append("percentage", 70);
    } else {
      if (data.salary) formData.append("salary", data.salary);
      if (data.percentage) formData.append("percentage", data.percentage);
    }

    // Append other form data
    formData.append("full_name", data.full_name);
    formData.append("phone_number", phone);
    formData.append("password", data.password);
    formData.append(
      "enrollment_date",
      data.enrollment_date.toISOString().split("T")[0]
    );
    if (data.profile_photo && data.profile_photo.length > 0) {
      formData.append("profile_photo", data.profile_photo[0]);
    }

    const toastId = toast.loading("O'qituvchi qo'shilmoqda...");
    try {
      await api.post("/users/teachers/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Muvaffaqiyatli qo'shildi", { id: toastId });
      refreshTeachers();
      handleClose();
    } catch (error) {
      toast.error(
        error.response?.data?.non_field_errors?.[0] || "Xatolik yuz berdi",
        { id: toastId }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">O'qituvchi qo'shish</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-6 overflow-y-auto"
          >
            <div className="flex justify-center">
              <input
                type="file"
                {...register("profile_photo")}
                ref={photoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current.click()}
                className="w-28 h-28 bg-blue-50 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-gray-600 hover:border-blue-400 transition"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Camera size={40} className="text-blue-400" />
                )}
              </button>
            </div>

            <Input
              id="full_name"
              label="Ism familiya"
              {...register("full_name")}
              error={errors.full_name}
            />

            <PhoneNumberInput
              name="phone_number"
              label="Telefon raqam"
              control={control}
              error={errors.phone_number}
            />

            <DateInput
              name="enrollment_date"
              label="Ishga olingan sana"
              control={control}
              error={errors.enrollment_date}
            />

            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                name="salary"
                label="Oylik (so'm)"
                control={control}
                error={errors.salary}
                suffix=" so'm"
              />
              <NumberInput
                name="percentage"
                label="Foiz (%)"
                control={control}
                error={errors.percentage}
                suffix=" %"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                label="Parol"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
            >
              SAQLASH
            </button>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddTeacherModal;
