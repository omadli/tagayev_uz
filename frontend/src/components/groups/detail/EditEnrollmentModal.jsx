import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../../ui/Portal";
import DateInput from "../../ui/DateInput";
import NumberInput from "../../ui/NumberInput";

const schema = yup.object().shape({
  joined_at: yup.date().required("Sana kiritilishi shart"),
  price: yup
    .number()
    .min(0)
    .transform((v) => (isNaN(v) ? undefined : v))
    .nullable(),
});

const EditEnrollmentModal = ({ isOpen, onClose, refreshData, enrollment }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (enrollment && isOpen) {
      reset({
        joined_at: new Date(enrollment.joined_at),
        price: enrollment.price || "",
      });
    }
  }, [isOpen, enrollment, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    const payload = {
      joined_at: data.joined_at.toISOString().split("T")[0],
      price: data.price || null,
    };

    const toastId = toast.loading("O'zgarishlar saqlanmoqda...");
    try {
      await api.patch(`/core/enrollments/${enrollment.id}/`, payload);
      toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
      refreshData();
      handleClose();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold truncate">
              {enrollment.student_full_name} ma'lumotlarini tahrirlash
            </h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <DateInput
              name="joined_at"
              label="Guruhga qo'shilgan sana"
              control={control}
              error={errors.joined_at}
            />
            <NumberInput
              name="price"
              label="Maxsus narx (ixtiyoriy)"
              suffix=" so'm"
              control={control}
              error={errors.price}
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
                SAQLASH
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditEnrollmentModal;
