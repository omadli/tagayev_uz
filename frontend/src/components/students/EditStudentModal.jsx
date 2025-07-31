import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Camera } from "lucide-react";

// Import our custom UI components
import Input from "../ui/Input";
import PhoneNumberInput from "../ui/PhoneNumberInput";
import DateInput from "../ui/DateInput";
import Portal from "../ui/Portal";

// Validation schema for editing a student
const schema = yup.object().shape({
  full_name: yup.string().required("Ism-familiya majburiy"),
  phone_number: yup
    .string()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .length(9)
    .required("Telefon raqam majburiy"),
  birth_date: yup
    .date()
    .nullable()
    .transform((v) => (v instanceof Date && !isNaN(v) ? v : null)),
  gender: yup.string().required("Jinsini tanlang"),
  comment: yup.string(),
  profile_photo: yup.mixed().optional(),
});

const EditStudentModal = ({ isOpen, onClose, refreshStudents, student }) => {
  const [photoPreview, setPhotoPreview] = useState(
    student?.profile_photo || null
  );
  const photoInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    // Pre-fill the form with the existing student's data
    defaultValues: {
      full_name: student?.full_name || "",
      phone_number: student ? String(student.phone_number).slice(3) : "",
      birth_date: student?.birth_date ? new Date(student.birth_date) : null,
      gender: student?.gender || "male",
      comment: student?.comment || "",
    },
  });

  // Effect to reset the form if the student prop changes
  useEffect(() => {
    if (student) {
      reset({
        full_name: student.full_name,
        phone_number: String(student.phone_number).slice(3),
        birth_date: student.birth_date ? new Date(student.birth_date) : null,
        gender: student.gender,
        comment: student.comment,
      });
      setPhotoPreview(student.profile_photo || null);
    }
  }, [student, reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleClose = () => {
    reset();
    setPhotoPreview(null);
    onClose();
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    const phone = `998${data.phone_number.replace(/[^\d]/g, "")}`;

    // Append all form data
    formData.append("full_name", data.full_name);
    formData.append("phone_number", phone);
    formData.append("gender", data.gender);
    if (data.birth_date)
      formData.append(
        "birth_date",
        data.birth_date.toISOString().split("T")[0]
      );
    if (data.comment) formData.append("comment", data.comment);

    // Only append the photo if a new one was selected
    if (data.profile_photo && data.profile_photo.length > 0) {
      formData.append("profile_photo", data.profile_photo[0]);
    }

    const toastId = toast.loading("O'zgarishlar saqlanmoqda...");
    try {
      // Use PATCH for partial updates
      await api.patch(`/core/students/${student.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
      refreshStudents();
      handleClose();
    } catch (error) {
      toast.error(
        error.response?.data?.phone_number?.[0] || "Xatolik yuz berdi",
        { id: toastId }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold">O'quvchini tahrirlash</h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-5 overflow-y-auto"
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
              name="birth_date"
              label="Tug'ilgan sana"
              control={control}
              error={errors.birth_date}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Jinsini tanlang
              </label>
              <div className="flex items-center space-x-6 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("gender")}
                    value="male"
                    className="h-4 w-4"
                  />{" "}
                  <span>Erkak</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("gender")}
                    value="female"
                    className="h-4 w-4"
                  />{" "}
                  <span>Ayol</span>
                </label>
              </div>
            </div>
            <Input
              id="comment"
              label="Izoh (ixtiyoriy)"
              {...register("comment")}
              error={errors.comment}
            />

            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="mr-3 px-5 py-2.5 border rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
              >
                SAQLASH
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditStudentModal;
