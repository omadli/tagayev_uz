import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../ui/Portal";
import Select from "react-select/async";
import DateInput from "../ui/DateInput";
import NumberInput from "../ui/NumberInput";

// Validation schema
const schema = yup.object().shape({
  group: yup.object().required("Guruh tanlanishi shart").nullable(),
  joined_at: yup.date().required("Sana kiritilishi shart"),
  price: yup
    .number()
    .min(0)
    .transform((v) => (isNaN(v) ? undefined : v))
    .nullable(),
});

const EnrollStudentModal = ({ isOpen, onClose, refreshStudents, student }) => {
  // State for the special price field visibility
  const [showPriceInput, setShowPriceInput] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      group: null,
      joined_at: new Date(),
      price: "",
    },
  });

  // --- THIS IS THE SMART FILTER LOGIC ---
  /**
   * Function to load group options from the API.
   * It sends the current student's ID to exclude groups they are already in.
   */
  const loadGroupOptions = (inputValue, callback) => {
    let params = {
      is_archived: false,
      search: inputValue,
      exclude_student: student.id, // The key to filtering
    };

    api.get("/core/groups/", { params }).then((res) => {
      const options = (res.data.results || res.data).map((g) => ({
        value: g.id,
        label: `${g.name} (${g.teacher_name})`,
      }));
      callback(options);
    });
  };

  const handleClose = () => {
    reset();
    setShowPriceInput(false);
    onClose();
  };

  const onSubmit = async (data) => {
    const payload = {
      student: student.id,
      group: data.group.value,
      joined_at: data.joined_at.toISOString().split("T")[0],
      price: showPriceInput ? data.price : null,
    };

    const toastId = toast.loading("O'quvchi guruhga qo'shilmoqda...");
    try {
      await api.post("/core/enrollments/", payload);
      toast.success("Muvaffaqiyatli qo'shildi", { id: toastId });
      refreshStudents();
      handleClose();
    } catch (error) {
      const errorMsg =
        error.response?.data?.student?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold truncate">
              "{student.full_name}"ni guruhga qo'shish
            </h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-5 overflow-y-auto"
          >
            <div>
              <label className="text-xs font-medium text-gray-500 px-2">
                Guruhni qidirish
              </label>
              <Controller
                name="group"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    cacheOptions
                    defaultOptions
                    loadOptions={loadGroupOptions}
                    placeholder="Guruh nomi yoki o'qituvchi bo'yicha qidirish..."
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                )}
              />
              {errors.group && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.group.message}
                </p>
              )}
            </div>

            <DateInput
              name="joined_at"
              label="Guruhga qo'shilish sanasi"
              control={control}
              error={errors.joined_at}
            />

            {showPriceInput ? (
              <NumberInput
                name="price"
                label="Maxsus narx"
                suffix=" so'm"
                control={control}
                error={errors.price}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowPriceInput(true)}
                className="w-full text-left text-sm text-blue-600 hover:underline"
              >
                + Maxsus chegirmali narx kiritish
              </button>
            )}

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
                QO'SHISH
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EnrollStudentModal;
