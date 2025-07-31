import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../ui/Portal";
import Input from "../ui/Input";

// Validation schema
const schema = yup.object().shape({
  name: yup.string().required("Xona nomi majburiy"),
  capacity: yup
    .number()
    .min(1, "Sig'im kamida 1 bo'lishi kerak")
    .required("Sig'im majburiy")
    .typeError("Faqat raqam kiriting"),
  extra_info: yup.string().optional(),
});

const RoomModal = ({
  isOpen,
  onClose,
  refreshRooms,
  room,
  selectedBranchId,
}) => {
  // Determine if we are in "edit" mode
  const isEditMode = !!room;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Pre-fill the form with existing data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      reset({
        name: room.name,
        capacity: room.capacity,
        extra_info: room.extra_info,
      });
    } else {
      reset({ name: "", capacity: "", extra_info: "" }); // Reset for "add" mode
    }
  }, [isOpen, room, isEditMode, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      branch: selectedBranchId, // Always associate with the current branch
    };

    const toastId = toast.loading(
      isEditMode ? "O'zgarishlar saqlanmoqda..." : "Xona qo'shilmoqda..."
    );
    try {
      if (isEditMode) {
        await api.patch(`/core/rooms/${room.id}/`, payload);
      } else {
        await api.post("/core/rooms/", payload);
      }
      toast.success(
        isEditMode ? "Muvaffaqiyatli saqlandi" : "Muvaffaqiyatli qo'shildi",
        { id: toastId }
      );
      refreshRooms();
      handleClose();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">
              {isEditMode ? "Xonani Tahrirlash" : "Yangi Xona Qo'shish"}
            </h2>
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
              label="Xona nomi"
              {...register("name")}
              error={errors.name}
            />
            <Input
              id="capacity"
              label="Sig'imi (o'quvchi soni)"
              type="number"
              {...register("capacity")}
              error={errors.capacity}
            />
            <Input
              id="extra_info"
              label="Qo'shimcha ma'lumot (ixtiyoriy)"
              {...register("extra_info")}
              error={errors.extra_info}
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
                {isEditMode ? "SAQLASH" : "QO'SHISH"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default RoomModal;
