import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Camera, Eye, EyeOff, Plus } from "lucide-react";
import Select from "react-select";

// Import our custom UI components
import Input from "../ui/Input";
import PhoneNumberInput from "../ui/PhoneNumberInput";
import DateInput from "../ui/DateInput";
import NumberInput from "../ui/NumberInput";
import Portal from "../ui/Portal";

const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  // Check if the number has no fractional part
  if (parseFloat(num) % 1 === 0) {
    return parseInt(num, 10);
  }
  return num;
};

// A slightly different schema for editing (password is optional)
const schema = yup.object().shape({
  full_name: yup.string().required(),
  phone_number: yup.string().required(),
  password: yup
    .string()
    .optional()
    .min(6)
    .transform((v) => (v === "" ? undefined : v)),
  enrollment_date: yup.date().required(),
  roles: yup.array().min(1).required(),
  // ... salary/percentage fields
});

const roleOptions = [
  { value: "is_teacher", label: "O'qituvchi" },
  { value: "is_admin", label: "Admin" },
  { value: "is_ceo", label: "CEO" },
];

const EditStaffModal = ({ isOpen, onClose, refreshUsers, user }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const photoInputRef = useRef(null);

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
      // No default salary/percentage, the backend handles the 70% default for teachers
    },
  });

  // Effect to pre-fill the form when the user prop is available
  useEffect(() => {
    if (user) {
      // Convert the boolean flags from the user object back into the array format for react-select
      const currentRoles = roleOptions.filter((option) => user[option.value]);

      reset({
        full_name: user.full_name,
        phone_number: String(user.phone_number).slice(3),
        enrollment_date: user.enrollment_date
          ? new Date(user.enrollment_date)
          : "",
        salary: formatNumber(user.salary),
        percentage: formatNumber(user.percentage),
        roles: currentRoles,
      });
      // ... setPhotoPreview ...
    }
  }, [user, reset]);

  const salaryValue = watch("salary");
  const percentageValue = watch("percentage");
  useEffect(() => {
    if (salaryValue) setValue("percentage", "");
  }, [salaryValue, setValue]);
  useEffect(() => {
    if (percentageValue) setValue("salary", "");
  }, [percentageValue, setValue]);

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
    // ... build formData ...
    const phone = `998${data.phone_number.replace(/[^\d]/g, "")}`;

    // 1. Append all the basic user fields
    formData.append("full_name", data.full_name);
    formData.append("phone_number", phone);
    formData.append(
      "enrollment_date",
      data.enrollment_date.toISOString().split("T")[0]
    );

    // 2. Handle the mutually exclusive salary/percentage
    if (data.salary) {
      formData.append("salary", data.salary);
      formData.append("percentage", ""); // Send empty to nullify
    } else if (data.percentage) {
      formData.append("percentage", data.percentage);
      formData.append("salary", ""); // Send empty to nullify
    } else {
      // If user cleared both, send empty for both
      formData.append("salary", "");
      formData.append("percentage", "");
    }

    // 3. Only append the password if the user entered a new one
    if (data.password) {
      formData.append("password", data.password);
    }

    // 4. Only append the photo if a new one was selected
    if (data.profile_photo && data.profile_photo.length > 0) {
      formData.append("profile_photo", data.profile_photo[0]);
    }
    // --- ROLE LOGIC ---
    // Start with all roles as false
    formData.append("is_teacher", false);
    formData.append("is_admin", false);
    formData.append("is_ceo", false);
    // Then set the selected ones to true
    data.roles.forEach((role) => {
      formData.set(role.value, true);
    });

    const toastId = toast.loading("O'zgarishlar saqlanmoqda...");
    try {
      await api.patch(`/users/users/${user.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
      refreshUsers();
      handleClose();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };

  if (!isOpen) return null;

  // --- Z-INDEX FIX: Custom styles for react-select ---
  const selectStyles = {
    menu: (base) => ({ ...base, zIndex: 50 }),
    menuPortal: (base) => ({ ...base, zIndex: 50 }),
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">
              Xodimni Tahrirlash - {user.full_name}
            </h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-4 overflow-y-auto"
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

            {/* --- ROLE SELECTION FIELD --- */}
            <div>
              <label className="text-sm font-medium mb-1 block">Rollar</label>
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    options={roleOptions}
                    placeholder="Rollarni tanlang..."
                    styles={selectStyles}
                  />
                )}
              />
              {errors.roles && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.roles.message}
                </p>
              )}
            </div>

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
            {errors[""] && (
              <p className="text-red-500 text-xs mt-1">{errors[""]?.message}</p>
            )}

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
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
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 flex items-center"
              >
                <span>O'ZGARISHLARNI SAQLASH</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditStaffModal;
